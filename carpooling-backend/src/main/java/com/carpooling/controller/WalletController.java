package com.carpooling.controller;

import com.carpooling.dto.TransactionDto;
import com.carpooling.dto.TopUpRequest;
import com.carpooling.dto.WalletResponse;
import com.carpooling.service.WalletService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping
    public ResponseEntity<WalletResponse> getWallet(Authentication authentication) {
        return ResponseEntity.ok(walletService.getWallet(authentication.getName()));
    }

    @PostMapping("/topup")
    public ResponseEntity<WalletResponse> topUp(
            Authentication authentication,
            @RequestBody TopUpRequest request
    ) {
        return ResponseEntity.ok(walletService.topUp(authentication.getName(), request));
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<TransactionDto>> listTransactions(Authentication authentication) {
        return ResponseEntity.ok(walletService.listTransactions(authentication.getName()));
    }
}