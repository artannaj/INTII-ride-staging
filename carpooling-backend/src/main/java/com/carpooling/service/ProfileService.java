package com.carpooling.service;

import com.carpooling.dto.ProfileResponse;
import com.carpooling.dto.UpdateProfileRequest;
import com.carpooling.exception.ApiException;
import com.carpooling.model.User;
import com.carpooling.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private final UserRepository userRepository;

    public ProfileService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(String email) {
        User user = findByEmail(email);
        return ProfileResponse.from(user);
    }

    @Transactional
    public ProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = findByEmail(email);

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            String newPhone = request.getPhone().trim();
            // Ensure phone uniqueness if changed
            if (!newPhone.equals(user.getPhone())
                    && userRepository.existsByPhone(newPhone)) {
                throw new ApiException("Phone number is already registered",
                        HttpStatus.CONFLICT.value());
            }
            user.setPhone(newPhone);
        }
        if (request.getFaculty() != null) {
            user.setFaculty(request.getFaculty().trim());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio().trim());
        }
        if (request.getProfilePhotoUrl() != null) {
            user.setProfilePhotoUrl(request.getProfilePhotoUrl().trim());
        }

        userRepository.save(user);
        return ProfileResponse.from(user);
    }

    private User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found",
                        HttpStatus.NOT_FOUND.value()));
    }
}