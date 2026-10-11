package com.carpooling.service;

import com.carpooling.dto.AuthResponse;
import com.carpooling.dto.LoginRequest;
import com.carpooling.dto.OtpSentResponse;
import com.carpooling.dto.ResendOtpRequest;
import com.carpooling.dto.RoleUpdateRequest;
import com.carpooling.dto.SignupRequest;
import com.carpooling.dto.UserResponse;
import com.carpooling.dto.VerifyOtpRequest;
import com.carpooling.exception.ApiException;
import com.carpooling.model.PendingSignup;
import com.carpooling.model.User;
import com.carpooling.repository.PendingSignupRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.validation.MalaysianPhoneValidator;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final int MAX_OTP_ATTEMPTS = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 60;

    private final UserRepository userRepository;
    private final PendingSignupRepository pendingSignupRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            UserRepository userRepository,
            PendingSignupRepository pendingSignupRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            EmailService emailService
    ) {
        this.userRepository = userRepository;
        this.pendingSignupRepository = pendingSignupRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
    }

    @Transactional
    public OtpSentResponse signup(SignupRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String username = request.getUsername().trim();
        String phone = MalaysianPhoneValidator.normalize(request.getPhone());

        if (userRepository.existsByEmail(email)) {
            throw new ApiException("Email is already registered", HttpStatus.CONFLICT.value());
        }
        if (userRepository.existsByUsername(username)) {
            throw new ApiException("Username is already taken", HttpStatus.CONFLICT.value());
        }
        if (userRepository.existsByPhone(phone)) {
            throw new ApiException("Phone number is already registered", HttpStatus.CONFLICT.value());
        }

        PendingSignup existing = pendingSignupRepository.findByEmail(email).orElse(null);
        if (existing != null) {
            enforceResendCooldown(existing);
            // Allow same email to retry signup with updated details; clear old row first
            pendingSignupRepository.delete(existing);
            pendingSignupRepository.flush();
        }

        if (pendingSignupRepository.existsByUsername(username)) {
            throw new ApiException("Username is already taken", HttpStatus.CONFLICT.value());
        }
        if (pendingSignupRepository.existsByPhone(phone)) {
            throw new ApiException("Phone number is already registered", HttpStatus.CONFLICT.value());
        }

        String otp = generateOtp();
        PendingSignup pending = new PendingSignup();
        pending.setEmail(email);
        pending.setUsername(username);
        pending.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        pending.setPhone(phone);
        pending.setRole(request.getRole());
        pending.setOtpHash(passwordEncoder.encode(otp));
        pending.setCreatedAt(Instant.now());
        pending.setExpiresAt(Instant.now().plus(OTP_EXPIRY_MINUTES, ChronoUnit.MINUTES));
        pending.setAttemptCount(0);
        pendingSignupRepository.save(pending);

        try {
            emailService.sendSignupOtp(email, otp);
        } catch (Exception ex) {
            pendingSignupRepository.delete(pending);
            throw new ApiException(
                    "Failed to send verification email. Check mail settings.",
                    HttpStatus.BAD_GATEWAY.value()
            );
        }

        return new OtpSentResponse(email, "Verification code sent to your email");
    }

    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String otp = request.getOtp().trim();

        PendingSignup pending = pendingSignupRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(
                        "No pending signup found. Please sign up again.",
                        HttpStatus.NOT_FOUND.value()
                ));

        if (pending.getExpiresAt().isBefore(Instant.now())) {
            pendingSignupRepository.delete(pending);
            throw new ApiException("OTP expired. Please sign up again.", HttpStatus.BAD_REQUEST.value());
        }

        if (pending.getAttemptCount() >= MAX_OTP_ATTEMPTS) {
            pendingSignupRepository.delete(pending);
            throw new ApiException(
                    "Too many invalid attempts. Please sign up again.",
                    HttpStatus.BAD_REQUEST.value()
            );
        }

        if (!passwordEncoder.matches(otp, pending.getOtpHash())) {
            pending.setAttemptCount(pending.getAttemptCount() + 1);
            pendingSignupRepository.save(pending);
            throw new ApiException("Invalid verification code", HttpStatus.BAD_REQUEST.value());
        }

        if (userRepository.existsByEmail(pending.getEmail())
                || userRepository.existsByUsername(pending.getUsername())
                || userRepository.existsByPhone(pending.getPhone())) {
            pendingSignupRepository.delete(pending);
            throw new ApiException("Account already exists. Please log in.", HttpStatus.CONFLICT.value());
        }

        User user = new User(
                pending.getEmail(),
                pending.getUsername(),
                pending.getPasswordHash(),
                pending.getPhone(),
                pending.getRole()
        );
        userRepository.save(user);
        pendingSignupRepository.delete(pending);

        String token = jwtService.generateToken(user.getEmail(), user.getRole());
        return new AuthResponse(token, user.getEmail(), user.getUsername(), user.getPhone(), user.getRole());
    }

    @Transactional
    public OtpSentResponse resendOtp(ResendOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        PendingSignup pending = pendingSignupRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(
                        "No pending signup found. Please sign up again.",
                        HttpStatus.NOT_FOUND.value()
                ));

        enforceResendCooldown(pending);

        String otp = generateOtp();
        pending.setOtpHash(passwordEncoder.encode(otp));
        pending.setExpiresAt(Instant.now().plus(OTP_EXPIRY_MINUTES, ChronoUnit.MINUTES));
        pending.setCreatedAt(Instant.now());
        pending.setAttemptCount(0);
        pendingSignupRepository.save(pending);

        try {
            emailService.sendSignupOtp(email, otp);
        } catch (Exception ex) {
            throw new ApiException(
                    "Failed to send verification email. Check mail settings.",
                    HttpStatus.BAD_GATEWAY.value()
            );
        }

        return new OtpSentResponse(email, "A new verification code was sent");
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.UNAUTHORIZED.value()));

        String token = jwtService.generateToken(user.getEmail(), user.getRole());
        return new AuthResponse(token, user.getEmail(), user.getUsername(), user.getPhone(), user.getRole());
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = findByEmail(email);
        return toUserResponse(user);
    }

    @Transactional
    public UserResponse updateRole(String email, RoleUpdateRequest request) {
        User user = findByEmail(email);
        user.setRole(request.getRole());
        userRepository.save(user);
        return toUserResponse(user);
    }

    private void enforceResendCooldown(PendingSignup pending) {
        Instant earliest = pending.getCreatedAt().plus(RESEND_COOLDOWN_SECONDS, ChronoUnit.SECONDS);
        if (Instant.now().isBefore(earliest)) {
            long secondsLeft = ChronoUnit.SECONDS.between(Instant.now(), earliest);
            throw new ApiException(
                    "Please wait " + Math.max(secondsLeft, 1) + "s before requesting another code",
                    HttpStatus.TOO_MANY_REQUESTS.value()
            );
        }
    }

    private String generateOtp() {
        int bound = (int) Math.pow(10, OTP_LENGTH);
        int number = secureRandom.nextInt(bound / 10, bound);
        return String.valueOf(number);
    }

    private User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND.value()));
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getPhone(),
                user.getRole()
        );
    }
}
