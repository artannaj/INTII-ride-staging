package com.carpooling.service;

import com.carpooling.dto.PlaceRequest;
import com.carpooling.dto.PlaceResponse;
import com.carpooling.exception.ApiException;
import com.carpooling.model.SavedPlace;
import com.carpooling.model.User;
import com.carpooling.repository.SavedPlaceRepository;
import com.carpooling.repository.UserRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlaceService {

    private final SavedPlaceRepository placeRepository;
    private final UserRepository userRepository;

    public PlaceService(SavedPlaceRepository placeRepository, UserRepository userRepository) {
        this.placeRepository = placeRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<PlaceResponse> list(String email) {
        Long userId = currentUserId(email);
        return placeRepository.findByUserIdOrderByCreatedAtAsc(userId)
                .stream()
                .map(PlaceResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public PlaceResponse create(String email, PlaceRequest request) {
        validate(request);
        Long userId = currentUserId(email);

        SavedPlace place = new SavedPlace();
        place.setUserId(userId);
        place.setLabel(request.getLabel().trim());
        place.setAddress(request.getAddress().trim());
        place.setIcon(request.getIcon() != null && !request.getIcon().isBlank()
                ? request.getIcon().trim() : "pin");

        placeRepository.save(place);
        return PlaceResponse.from(place);
    }

    @Transactional
    public PlaceResponse update(String email, Long placeId, PlaceRequest request) {
        validate(request);
        Long userId = currentUserId(email);

        SavedPlace place = placeRepository.findById(placeId)
                .orElseThrow(() -> new ApiException("Place not found", HttpStatus.NOT_FOUND.value()));

        if (!place.getUserId().equals(userId)) {
            throw new ApiException("Not your place", HttpStatus.FORBIDDEN.value());
        }

        place.setLabel(request.getLabel().trim());
        place.setAddress(request.getAddress().trim());
        if (request.getIcon() != null && !request.getIcon().isBlank()) {
            place.setIcon(request.getIcon().trim());
        }

        placeRepository.save(place);
        return PlaceResponse.from(place);
    }

    @Transactional
    public void delete(String email, Long placeId) {
        Long userId = currentUserId(email);

        SavedPlace place = placeRepository.findById(placeId)
                .orElseThrow(() -> new ApiException("Place not found", HttpStatus.NOT_FOUND.value()));

        if (!place.getUserId().equals(userId)) {
            throw new ApiException("Not your place", HttpStatus.FORBIDDEN.value());
        }

        placeRepository.delete(place);
    }

    private void validate(PlaceRequest request) {
        if (request.getLabel() == null || request.getLabel().isBlank()) {
            throw new ApiException("Label is required", HttpStatus.BAD_REQUEST.value());
        }
        if (request.getAddress() == null || request.getAddress().isBlank()) {
            throw new ApiException("Address is required", HttpStatus.BAD_REQUEST.value());
        }
    }

    private Long currentUserId(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND.value()));
        return user.getId();
    }
}