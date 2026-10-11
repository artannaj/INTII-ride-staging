package com.carpooling.dto;

public class OtpVerifyResponse {

    private Boolean valid;
    private String message;

    public OtpVerifyResponse() {
    }

    public OtpVerifyResponse(Boolean valid, String message) {
        this.valid = valid;
        this.message = message;
    }

    public Boolean getValid() { return valid; }
    public void setValid(Boolean valid) { this.valid = valid; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}