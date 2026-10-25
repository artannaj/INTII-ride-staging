package com.carpooling.service;

import com.carpooling.dto.PaymentMethodDto;
import com.carpooling.dto.PaymentMethodRequest;
import com.carpooling.exception.ApiException;
import com.carpooling.model.PaymentMethod;
import com.carpooling.model.User;
import com.carpooling.repository.PaymentMethodRepository;
import com.carpooling.repository.UserRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentMethodService {

    private final PaymentMethodRepository methodRepository;
    private final UserRepository userRepository;

    public PaymentMethodService(PaymentMethodRepository methodRepository,
                                UserRepository userRepository) {
        this.methodRepository = methodRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<PaymentMethodDto> list(String email) {
        Long userId = currentUserId(email);
        return methodRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(PaymentMethodDto::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public PaymentMethodDto create(String email, PaymentMethodRequest request) {
        validate(request);
        Long userId = currentUserId(email);

        PaymentMethod.Type type = parseType(request.getType());

        PaymentMethod method = new PaymentMethod();
        method.setUserId(userId);
        method.setType(type);
        method.setProvider(request.getProvider().trim());
        method.setAccountRef(maskAccountRef(type, request.getAccountRef()));
        method.setExpiryDate(normaliseExpiry(type, request.getExpiryDate()));

        boolean makeDefault = Boolean.TRUE.equals(request.getIsDefault());
        // If this is the first method, always make it default
        if (methodRepository.findByUserIdOrderByCreatedAtDesc(userId).isEmpty()) {
            makeDefault = true;
        }

        if (makeDefault) {
            clearExistingDefault(userId);
            method.setIsDefault(true);
        } else {
            method.setIsDefault(false);
        }

        methodRepository.save(method);
        return PaymentMethodDto.from(method);
    }

    @Transactional
    public PaymentMethodDto update(String email, Long id, PaymentMethodRequest request) {
        validate(request);
        Long userId = currentUserId(email);

        PaymentMethod method = methodRepository.findById(id)
                .orElseThrow(() -> new ApiException("Payment method not found", HttpStatus.NOT_FOUND.value()));

        if (!method.getUserId().equals(userId)) {
            throw new ApiException("Not your payment method", HttpStatus.FORBIDDEN.value());
        }

        PaymentMethod.Type type = parseType(request.getType());
        method.setType(type);
        method.setProvider(request.getProvider().trim());
        // Keep the stored mask if the client sends it back unchanged
        if (request.getAccountRef() != null && !request.getAccountRef().equals(method.getAccountRef())) {
            method.setAccountRef(maskAccountRef(type, request.getAccountRef()));
        }
        method.setExpiryDate(normaliseExpiry(type, request.getExpiryDate()));

        methodRepository.save(method);
        return PaymentMethodDto.from(method);
    }

    @Transactional
    public void delete(String email, Long id) {
        Long userId = currentUserId(email);

        PaymentMethod method = methodRepository.findById(id)
                .orElseThrow(() -> new ApiException("Payment method not found", HttpStatus.NOT_FOUND.value()));

        if (!method.getUserId().equals(userId)) {
            throw new ApiException("Not your payment method", HttpStatus.FORBIDDEN.value());
        }

        boolean wasDefault = Boolean.TRUE.equals(method.getIsDefault());
        methodRepository.delete(method);

        // If we deleted the default, promote the next-newest method to default
        if (wasDefault) {
            List<PaymentMethod> remaining = methodRepository.findByUserIdOrderByCreatedAtDesc(userId);
            if (!remaining.isEmpty()) {
                PaymentMethod next = remaining.get(0);
                next.setIsDefault(true);
                methodRepository.save(next);
            }
        }
    }

    @Transactional
    public PaymentMethodDto setDefault(String email, Long id) {
        Long userId = currentUserId(email);

        PaymentMethod method = methodRepository.findById(id)
                .orElseThrow(() -> new ApiException("Payment method not found", HttpStatus.NOT_FOUND.value()));

        if (!method.getUserId().equals(userId)) {
            throw new ApiException("Not your payment method", HttpStatus.FORBIDDEN.value());
        }

        clearExistingDefault(userId);
        method.setIsDefault(true);
        methodRepository.save(method);
        return PaymentMethodDto.from(method);
    }

    private void clearExistingDefault(Long userId) {
        methodRepository.findByUserIdAndIsDefaultTrue(userId)
                .ifPresent(existing -> {
                    existing.setIsDefault(false);
                    methodRepository.save(existing);
                });
    }

    private void validate(PaymentMethodRequest request) {
        if (request.getType() == null || request.getType().isBlank()) {
            throw new ApiException("Payment type is required", HttpStatus.BAD_REQUEST.value());
        }
        if (request.getProvider() == null || request.getProvider().isBlank()) {
            throw new ApiException("Provider is required", HttpStatus.BAD_REQUEST.value());
        }
    }

    /**
     * Never store full card/account numbers: keep only the last 4 digits,
     * e.g. "4111 1111 1111 4821" becomes "•••• 4821".
     */
    private String maskAccountRef(PaymentMethod.Type type, String raw) {
        if (type == PaymentMethod.Type.CASH || raw == null || raw.isBlank()) return null;
        String digits = raw.replaceAll("\\D", "");
        if (digits.length() < 4) {
            throw new ApiException("Enter at least the last 4 digits of the account", HttpStatus.BAD_REQUEST.value());
        }
        return "•••• " + digits.substring(digits.length() - 4);
    }

    private String normaliseExpiry(PaymentMethod.Type type, String raw) {
        if (type != PaymentMethod.Type.CARD || raw == null || raw.isBlank()) return null;
        String value = raw.trim();
        if (!value.matches("(0[1-9]|1[0-2])/\\d{2}")) {
            throw new ApiException("Card expiry must be MM/YY", HttpStatus.BAD_REQUEST.value());
        }
        return value;
    }

    private PaymentMethod.Type parseType(String raw) {
        try {
            return PaymentMethod.Type.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ApiException("Invalid payment type. Use CARD, EWALLET, BANK, or CASH",
                    HttpStatus.BAD_REQUEST.value());
        }
    }

    private Long currentUserId(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND.value()));
        return user.getId();
    }
}