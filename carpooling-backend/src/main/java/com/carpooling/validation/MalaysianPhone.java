package com.carpooling.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = MalaysianPhoneValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface MalaysianPhone {

    String message() default "Phone must be a valid Malaysian mobile number (+60)";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
