package com.carpooling.controller;

import com.carpooling.dto.RoleUpdateRequest;
import com.carpooling.dto.UserResponse;
import com.carpooling.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AuthService authService;

    public UserController(AuthService authService) {
        this.authService = authService;
    }

    @PatchMapping("/role")
    public ResponseEntity<UserResponse> updateRole(
            Authentication authentication,
            @Valid @RequestBody RoleUpdateRequest request
    ) {
        return ResponseEntity.ok(authService.updateRole(authentication.getName(), request));
    }
}
