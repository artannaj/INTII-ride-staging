package com.carpooling.controller;

import com.carpooling.dto.SettingsResponse;
import com.carpooling.dto.UpdateSettingsRequest;
import com.carpooling.service.SettingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
public class SettingController {

    private final SettingService settingService;

    public SettingController(SettingService settingService) {
        this.settingService = settingService;
    }

    @GetMapping
    public ResponseEntity<SettingsResponse> get(Authentication authentication) {
        return ResponseEntity.ok(settingService.get(authentication.getName()));
    }

    @PutMapping
    public ResponseEntity<SettingsResponse> update(
            Authentication authentication,
            @RequestBody UpdateSettingsRequest request
    ) {
        return ResponseEntity.ok(settingService.update(authentication.getName(), request));
    }

    @DeleteMapping("/account")
    public ResponseEntity<Void> deleteAccount(Authentication authentication) {
        settingService.softDeleteAccount(authentication.getName());
        return ResponseEntity.noContent().build();
    }
}