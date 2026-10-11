package com.carpooling.service;

import com.carpooling.dto.ForgotPasswordRequest;
import com.carpooling.dto.OtpVerifyResponse;
import com.carpooling.dto.ResetPasswordRequest;
import com.carpooling.exception.ApiException;
import com.carpooling.model.OtpCode;
import com.carpooling.model.User;
import com.carpooling.repository.OtpCodeRepository;
import com.carpooling.repository.UserRepository;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PasswordResetService {

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 10;

    private final UserRepository userRepository;
    private final OtpCodeRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordResetService(UserRepository userRepository,
                                OtpCodeRepository otpRepository,
                                PasswordEncoder passwordEncoder,
                                EmailService emailService) {
        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Transactional
    public OtpVerifyResponse forgotPassword(ForgotPasswordRequest request) {
        String email = normalize(request.getEmail());
        if (email.isBlank()) {
            throw new ApiException("Email is required", HttpStatus.BAD_REQUEST.value());
        }

        // Silent success if user doesn't exist (avoids account enumeration)
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return new OtpVerifyResponse(true, "If the email exists, a reset code was sent.");
        }

        String otp = generateOtp();

        // Store hashed OTP
        OtpCode code = new OtpCode();
        code.setEmail(email);
        code.setCode(passwordEncoder.encode(otp));
        code.setPurpose(OtpCode.Purpose.RESET_PASSWORD);
        code.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        code.setUsed(false);
        otpRepository.save(code);

        // DEV: log OTP to console
        emailService.sendPasswordResetOtp(email, otp);

        return new OtpVerifyResponse(true, "If the email exists, a reset code was sent.");
    }

    @Transactional
    public OtpVerifyResponse verifyResetOtp(ResetPasswordRequest request) {
        String email = normalize(request.getEmail());
        String otp = request.getOtp() == null ? "" : request.getOtp().trim();

        OtpCode stored = otpRepository
                .findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, OtpCode.Purpose.RESET_PASSWORD)
                .orElseThrow(() -> new ApiException("No reset request found", HttpStatus.NOT_FOUND.value()));

        if (stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            otpRepository.delete(stored);
            throw new ApiException("Reset code expired", HttpStatus.BAD_REQUEST.value());
        }

        if (!passwordEncoder.matches(otp, stored.getCode())) {
            throw new ApiException("Invalid reset code", HttpStatus.BAD_REQUEST.value());
        }

        return new OtpVerifyResponse(true, "Reset code is valid");
    }

    @Transactional
    public OtpVerifyResponse resetPassword(ResetPasswordRequest request) {
        String email = normalize(request.getEmail());
        String otp = request.getOtp() == null ? "" : request.getOtp().trim();
        String newPassword = request.getNewPassword();

        if (newPassword == null || newPassword.length() < 8) {
            throw new ApiException("Password must be at least 8 characters", HttpStatus.BAD_REQUEST.value());
        }

        OtpCode stored = otpRepository
                .findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, OtpCode.Purpose.RESET_PASSWORD)
                .orElseThrow(() -> new ApiException("No reset request found", HttpStatus.NOT_FOUND.value()));

        if (stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            otpRepository.delete(stored);
            throw new ApiException("Reset code expired", HttpStatus.BAD_REQUEST.value());
        }

        if (!passwordEncoder.matches(otp, stored.getCode())) {
            throw new ApiException("Invalid reset code", HttpStatus.BAD_REQUEST.value());
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND.value()));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        stored.setUsed(true);
        otpRepository.save(stored);

        return new OtpVerifyResponse(true, "Password updated successfully");
    }

    private String generateOtp() {
        int bound = (int) Math.pow(10, OTP_LENGTH);
        int number = secureRandom.nextInt(bound / 10, bound);
        return String.valueOf(number);
    }

    private String normalize(String raw) {
        return raw == null ? "" : raw.trim().toLowerCase();
    }
}