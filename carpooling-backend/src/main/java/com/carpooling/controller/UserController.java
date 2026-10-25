package com.carpooling.controller;

import com.carpooling.dto.DriverProfileRequest;
import com.carpooling.dto.DriverProfileResponse;
import com.carpooling.dto.RoleUpdateRequest;
import com.carpooling.dto.UserResponse;
import com.carpooling.service.AuthService;
import com.carpooling.service.DriverProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AuthService authService;
    private final DriverProfileService driverProfileService;

    public UserController(AuthService authService, DriverProfileService driverProfileService) {
        this.authService = authService;
        this.driverProfileService = driverProfileService;
    }

    @PatchMapping("/role")
    public ResponseEntity<UserResponse> updateRole(
            Authentication authentication,
            @Valid @RequestBody RoleUpdateRequest request
    ) {
        return ResponseEntity.ok(authService.updateRole(authentication.getName(), request));
    }

    @GetMapping("/driver-profile")
    public ResponseEntity<DriverProfileResponse> driverProfile(Authentication authentication) {
        return ResponseEntity.ok(driverProfileService.get(authentication.getName()));
    }

    @PutMapping("/driver-profile")
    public ResponseEntity<DriverProfileResponse> saveDriverProfile(
            Authentication authentication,
            @Valid @RequestBody DriverProfileRequest request
    ) {
        return ResponseEntity.ok(driverProfileService.save(authentication.getName(), request));
    }
}
