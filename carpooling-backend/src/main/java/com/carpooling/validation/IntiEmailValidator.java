package com.carpooling.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class IntiEmailValidator implements ConstraintValidator<IntiEmail, String> {

    private static final String REQUIRED_SUFFIX = ".newinti.edu.my";

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return false;
        }
        String email = value.trim().toLowerCase();
        return email.contains("@") && email.endsWith(REQUIRED_SUFFIX);
    }
}
