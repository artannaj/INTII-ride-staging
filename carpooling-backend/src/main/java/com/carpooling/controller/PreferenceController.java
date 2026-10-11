package com.carpooling.controller;

import com.carpooling.dto.PreferenceRequest;
import com.carpooling.dto.PreferenceResponse;
import com.carpooling.service.PreferenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/preferences")
public class PreferenceController {

    private final PreferenceService preferenceService;

    public PreferenceController(PreferenceService preferenceService) {
        this.preferenceService = preferenceService;
    }

    @GetMapping
    public ResponseEntity<PreferenceResponse> get(Authentication authentication) {
        return ResponseEntity.ok(preferenceService.get(authentication.getName()));
    }

    @PutMapping
    public ResponseEntity<PreferenceResponse> update(
            Authentication authentication,
            @RequestBody PreferenceRequest request
    ) {
        return ResponseEntity.ok(preferenceService.update(authentication.getName(), request));
    }
}