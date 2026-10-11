package com.carpooling.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

public class MalaysianPhoneValidator implements ConstraintValidator<MalaysianPhone, String> {

    // Malaysian mobile: +601 followed by 8–9 digits (local 01X… without the leading 0)
    private static final Pattern MY_MOBILE = Pattern.compile("^\\+601[0-9]{8,9}$");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return false;
        }
        return MY_MOBILE.matcher(normalize(value)).matches();
    }

    public static String normalize(String raw) {
        String digits = raw.trim().replaceAll("[\\s\\-()]", "");
        if (digits.startsWith("60") && !digits.startsWith("+")) {
            digits = "+" + digits;
        }
        if (digits.startsWith("0")) {
            digits = "+60" + digits.substring(1);
        }
        if (!digits.startsWith("+") && digits.startsWith("1")) {
            digits = "+60" + digits;
        }
        if (digits.startsWith("+600")) {
            // +60 + leading 0 typed again → strip that 0
            digits = "+60" + digits.substring(4);
        }
        return digits;
    }
}
