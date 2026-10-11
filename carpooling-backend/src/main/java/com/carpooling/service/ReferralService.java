package com.carpooling.service;

import com.carpooling.dto.ReferralDto;
import com.carpooling.dto.ReferralResponse;
import com.carpooling.exception.ApiException;
import com.carpooling.model.Referral;
import com.carpooling.model.User;
import com.carpooling.repository.ReferralRepository;
import com.carpooling.repository.UserRepository;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReferralService {

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 8;
    private final SecureRandom random = new SecureRandom();

    private final UserRepository userRepository;
    private final ReferralRepository referralRepository;

    public ReferralService(UserRepository userRepository,
                           ReferralRepository referralRepository) {
        this.userRepository = userRepository;
        this.referralRepository = referralRepository;
    }

    @Transactional
    public ReferralResponse getSummary(String email) {
        User user = findByEmail(email);

        if (user.getReferralCode() == null || user.getReferralCode().isBlank()) {
            user.setReferralCode(generateUniqueCode());
            userRepository.save(user);
        }

        List<Referral> referrals = referralRepository
                .findByReferrerIdOrderByCreatedAtDesc(user.getId());

        long completedCount = referrals.stream()
                .filter(r -> r.getStatus() == Referral.Status.COMPLETED)
                .count();

        BigDecimal totalEarned = referrals.stream()
                .filter(r -> r.getStatus() == Referral.Status.COMPLETED)
                .map(Referral::getRewardAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        ReferralResponse response = new ReferralResponse();
        response.setCode(user.getReferralCode());
        response.setInvitedCount(referrals.size());
        response.setCompletedCount((int) completedCount);
        response.setTotalEarned(totalEarned);
        response.setReferrals(referrals.stream().map(ReferralDto::from).collect(Collectors.toList()));
        return response;
    }

    @Transactional
    public ReferralResponse regenerateCode(String email) {
        User user = findByEmail(email);
        user.setReferralCode(generateUniqueCode());
        userRepository.save(user);
        return getSummary(email);
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
            }
            String code = sb.toString();
            if (userRepository.findByReferralCode(code).isEmpty()) {
                return code;
            }
        }
        throw new ApiException("Could not generate a unique referral code",
                HttpStatus.INTERNAL_SERVER_ERROR.value());
    }

    private User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND.value()));
    }
}