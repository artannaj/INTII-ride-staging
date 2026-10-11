package com.carpooling.service;

import com.carpooling.dto.PreferenceRequest;
import com.carpooling.dto.PreferenceResponse;
import com.carpooling.exception.ApiException;
import com.carpooling.model.User;
import com.carpooling.model.UserPreference;
import com.carpooling.repository.UserPreferenceRepository;
import com.carpooling.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PreferenceService {

    private final UserPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;

    public PreferenceService(UserPreferenceRepository preferenceRepository,
                             UserRepository userRepository) {
        this.preferenceRepository = preferenceRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public PreferenceResponse get(String email) {
        Long userId = currentUserId(email);
        UserPreference prefs = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserPreference p = new UserPreference(userId);
                    return preferenceRepository.save(p);
                });
        return PreferenceResponse.from(prefs);
    }

    @Transactional
    public PreferenceResponse update(String email, PreferenceRequest request) {
        Long userId = currentUserId(email);
        UserPreference prefs = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> preferenceRepository.save(new UserPreference(userId)));

        if (request.getQuietRide() != null) prefs.setQuietRide(request.getQuietRide());
        if (request.getAcOn() != null) prefs.setAcOn(request.getAcOn());
        if (request.getMusicOk() != null) prefs.setMusicOk(request.getMusicOk());
        if (request.getWomenOnly() != null) prefs.setWomenOnly(request.getWomenOnly());
        if (request.getLuggageSpace() != null) prefs.setLuggageSpace(request.getLuggageSpace());
        if (request.getPetFriendly() != null) prefs.setPetFriendly(request.getPetFriendly());
        if (request.getNotifyRideUpdates() != null) prefs.setNotifyRideUpdates(request.getNotifyRideUpdates());
        if (request.getNotifyPayments() != null) prefs.setNotifyPayments(request.getNotifyPayments());
        if (request.getNotifyPromos() != null) prefs.setNotifyPromos(request.getNotifyPromos());
        if (request.getNotifyReminders() != null) prefs.setNotifyReminders(request.getNotifyReminders());

        preferenceRepository.save(prefs);
        return PreferenceResponse.from(prefs);
    }

    private Long currentUserId(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND.value()));
        return user.getId();
    }
}