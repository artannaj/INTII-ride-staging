package com.carpooling.controller;

import com.carpooling.dto.ReferralResponse;
import com.carpooling.service.ReferralService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/referrals")
public class ReferralController {

    private final ReferralService referralService;

    public ReferralController(ReferralService referralService) {
        this.referralService = referralService;
    }

    @GetMapping
    public ResponseEntity<ReferralResponse> get(Authentication authentication) {
        return ResponseEntity.ok(referralService.getSummary(authentication.getName()));
    }

    @PostMapping("/generate")
    public ResponseEntity<ReferralResponse> generate(Authentication authentication) {
        return ResponseEntity.ok(referralService.regenerateCode(authentication.getName()));
    }
}