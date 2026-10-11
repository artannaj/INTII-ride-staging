package com.carpooling.controller;

import com.carpooling.dto.PaymentMethodDto;
import com.carpooling.dto.PaymentMethodRequest;
import com.carpooling.service.PaymentMethodService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payment-methods")
public class PaymentMethodController {

    private final PaymentMethodService service;

    public PaymentMethodController(PaymentMethodService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<PaymentMethodDto>> list(Authentication authentication) {
        return ResponseEntity.ok(service.list(authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<PaymentMethodDto> create(
            Authentication authentication,
            @RequestBody PaymentMethodRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(authentication.getName(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PaymentMethodDto> update(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody PaymentMethodRequest request
    ) {
        return ResponseEntity.ok(service.update(authentication.getName(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            Authentication authentication,
            @PathVariable Long id
    ) {
        service.delete(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/default")
    public ResponseEntity<PaymentMethodDto> setDefault(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(service.setDefault(authentication.getName(), id));
    }
}