package com.carpooling.dto;

public class UpdateSettingsRequest {

    private String language;
    private Boolean twoFactorEnabled;
    private Boolean biometricEnabled;

    public UpdateSettingsRequest() {
    }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public Boolean getTwoFactorEnabled() { return twoFactorEnabled; }
    public void setTwoFactorEnabled(Boolean twoFactorEnabled) { this.twoFactorEnabled = twoFactorEnabled; }

    public Boolean getBiometricEnabled() { return biometricEnabled; }
    public void setBiometricEnabled(Boolean biometricEnabled) { this.biometricEnabled = biometricEnabled; }
}