package com.carpooling.dto;

import com.carpooling.model.Role;
import com.carpooling.model.User;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ProfileResponse {

    private Long id;
    private String email;
    private String username;
    private String phone;
    private Role role;
    private String fullName;
    private String faculty;
    private String bio;
    private String profilePhotoUrl;
    private Boolean verifiedStudent;
    private String referralCode;
    private String referredBy;
    private String language;
    private Boolean twoFactorEnabled;
    private Boolean biometricEnabled;
    private String status;
    private BigDecimal balance;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ProfileResponse() {
    }

    public static ProfileResponse from(User u) {
        ProfileResponse r = new ProfileResponse();
        r.id = u.getId();
        r.email = u.getEmail();
        r.username = u.getUsername();
        r.phone = u.getPhone();
        r.role = u.getRole();
        r.fullName = u.getFullName();
        r.faculty = u.getFaculty();
        r.bio = u.getBio();
        r.profilePhotoUrl = u.getProfilePhotoUrl();
        r.verifiedStudent = u.getVerifiedStudent();
        r.referralCode = u.getReferralCode();
        r.referredBy = u.getReferredBy();
        r.language = u.getLanguage();
        r.twoFactorEnabled = u.getTwoFactorEnabled();
        r.biometricEnabled = u.getBiometricEnabled();
        r.status = u.getStatus() != null ? u.getStatus().name() : null;
        r.balance = u.getBalance();
        r.createdAt = u.getCreatedAt();
        r.updatedAt = u.getUpdatedAt();
        return r;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getFaculty() { return faculty; }
    public void setFaculty(String faculty) { this.faculty = faculty; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public void setProfilePhotoUrl(String profilePhotoUrl) { this.profilePhotoUrl = profilePhotoUrl; }

    public Boolean getVerifiedStudent() { return verifiedStudent; }
    public void setVerifiedStudent(Boolean verifiedStudent) { this.verifiedStudent = verifiedStudent; }

    public String getReferralCode() { return referralCode; }
    public void setReferralCode(String referralCode) { this.referralCode = referralCode; }

    public String getReferredBy() { return referredBy; }
    public void setReferredBy(String referredBy) { this.referredBy = referredBy; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public Boolean getTwoFactorEnabled() { return twoFactorEnabled; }
    public void setTwoFactorEnabled(Boolean twoFactorEnabled) { this.twoFactorEnabled = twoFactorEnabled; }

    public Boolean getBiometricEnabled() { return biometricEnabled; }
    public void setBiometricEnabled(Boolean biometricEnabled) { this.biometricEnabled = biometricEnabled; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}