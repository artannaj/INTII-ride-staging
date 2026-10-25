package com.carpooling.service;

import com.carpooling.dto.DriverProfileRequest;
import com.carpooling.dto.DriverProfileResponse;
import com.carpooling.exception.ApiException;
import com.carpooling.model.Role;
import com.carpooling.model.User;
import com.carpooling.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class DriverProfileService {
    private final UserRepository userRepository;

    public DriverProfileService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public DriverProfileResponse get(String email) {
        return DriverProfileResponse.from(findUser(email));
    }

    /** Saves vehicle details and switches the account into driver mode. */
    @Transactional
    public DriverProfileResponse save(String email, DriverProfileRequest request) {
        User user = findUser(email);
        user.setVehicleModel(request.vehicleModel().trim());
        user.setVehicleColor(request.vehicleColor().trim());
        user.setVehiclePlate(request.vehiclePlate().trim().toUpperCase(Locale.ROOT));
        user.setRole(Role.DRIVER);
        userRepository.save(user);
        return DriverProfileResponse.from(user);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND.value()));
    }
}
