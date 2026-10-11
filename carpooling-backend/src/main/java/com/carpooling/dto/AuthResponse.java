package com.carpooling.dto;

import com.carpooling.model.Role;

public class AuthResponse {

    private String token;
    private String email;
    private String username;
    private String phone;
    private Role role;

    public AuthResponse() {
    }

    public AuthResponse(String token, String email, String username, String phone, Role role) {
        this.token = token;
        this.email = email;
        this.username = username;
        this.phone = phone;
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}
