package com.carpooling.service;

import com.carpooling.dto.SettingsResponse;
import com.carpooling.dto.UpdateSettingsRequest;
import com.carpooling.exception.ApiException;
import com.carpooling.model.User;
import com.carpooling.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SettingService {

    private final UserRepository userRepository;

    public SettingService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public SettingsResponse get(String email) {
        User user = findByEmail(email);
        return SettingsResponse.from(user);
    }

    @Transactional
    public SettingsResponse update(String email, UpdateSettingsRequest request) {
        User user = findByEmail(email);

        if (request.getLanguage() != null && !request.getLanguage().isBlank()) {
            user.setLanguage(request.getLanguage().trim());
        }
        if (request.getTwoFactorEnabled() != null) {
            user.setTwoFactorEnabled(request.getTwoFactorEnabled());
        }
        if (request.getBiometricEnabled() != null) {
            user.setBiometricEnabled(request.getBiometricEnabled());
        }

        userRepository.save(user);
        return SettingsResponse.from(user);
    }

    @Transactional
    public void softDeleteAccount(String email) {
        User user = findByEmail(email);
        user.setStatus(User.UserStatus.DELETED);
        userRepository.save(user);
    }

    private User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND.value()));
    }
}