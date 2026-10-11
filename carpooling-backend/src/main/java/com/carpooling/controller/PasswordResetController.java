package com.carpooling.controller;

import com.carpooling.dto.ForgotPasswordRequest;
import com.carpooling.dto.OtpVerifyResponse;
import com.carpooling.dto.ResetPasswordRequest;
import com.carpooling.service.PasswordResetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    public PasswordResetController(PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/forgot")
    public ResponseEntity<OtpVerifyResponse> forgot(@RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(passwordResetService.forgotPassword(request));
    }

    @PostMapping("/verify-reset-otp")
    public ResponseEntity<OtpVerifyResponse> verifyResetOtp(@RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(passwordResetService.verifyResetOtp(request));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<OtpVerifyResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(passwordResetService.resetPassword(request));
    }
}