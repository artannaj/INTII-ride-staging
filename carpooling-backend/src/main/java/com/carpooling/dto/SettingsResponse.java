package com.carpooling.dto;

import com.carpooling.model.User;

public class SettingsResponse {

    private String language;
    private Boolean twoFactorEnabled;
    private Boolean biometricEnabled;
    private String status;
    private String email;
    private String username;

    public SettingsResponse() {
    }

    public static SettingsResponse from(User u) {
        SettingsResponse r = new SettingsResponse();
        r.language = u.getLanguage();
        r.twoFactorEnabled = u.getTwoFactorEnabled();
        r.biometricEnabled = u.getBiometricEnabled();
        r.status = u.getStatus() != null ? u.getStatus().name() : null;
        r.email = u.getEmail();
        r.username = u.getUsername();
        return r;
    }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public Boolean getTwoFactorEnabled() { return twoFactorEnabled; }
    public void setTwoFactorEnabled(Boolean twoFactorEnabled) { this.twoFactorEnabled = twoFactorEnabled; }

    public Boolean getBiometricEnabled() { return biometricEnabled; }
    public void setBiometricEnabled(Boolean biometricEnabled) { this.biometricEnabled = biometricEnabled; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
}