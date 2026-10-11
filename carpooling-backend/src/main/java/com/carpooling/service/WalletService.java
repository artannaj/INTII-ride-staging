package com.carpooling.service;

import com.carpooling.dto.TransactionDto;
import com.carpooling.dto.TopUpRequest;
import com.carpooling.dto.WalletResponse;
import com.carpooling.exception.ApiException;
import com.carpooling.model.User;
import com.carpooling.model.Wallet;
import com.carpooling.model.WalletTransaction;
import com.carpooling.repository.UserRepository;
import com.carpooling.repository.WalletRepository;
import com.carpooling.repository.WalletTransactionRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository txRepository;
    private final UserRepository userRepository;

    public WalletService(WalletRepository walletRepository,
                         WalletTransactionRepository txRepository,
                         UserRepository userRepository) {
        this.walletRepository = walletRepository;
        this.txRepository = txRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public WalletResponse getWallet(String email) {
        Wallet wallet = getOrCreateWallet(currentUserId(email));
        List<TransactionDto> txs = txRepository
                .findByWalletIdOrderByCreatedAtDesc(wallet.getId())
                .stream()
                .map(TransactionDto::from)
                .collect(Collectors.toList());
        return buildResponse(wallet, txs);
    }

    @Transactional
    public WalletResponse topUp(String email, TopUpRequest request) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException("Amount must be greater than zero", HttpStatus.BAD_REQUEST.value());
        }

        Wallet wallet = getOrCreateWallet(currentUserId(email));
        wallet.setBalance(wallet.getBalance().add(request.getAmount()));
        walletRepository.save(wallet);

        String ref = "INT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        WalletTransaction tx = new WalletTransaction(
                wallet.getId(),
                WalletTransaction.Type.TOPUP,
                request.getAmount(),
                "Wallet top-up" + (request.getPaymentMethod() != null
                        ? " via " + request.getPaymentMethod() : ""),
                ref
        );
        txRepository.save(tx);

        List<TransactionDto> txs = txRepository
                .findByWalletIdOrderByCreatedAtDesc(wallet.getId())
                .stream()
                .map(TransactionDto::from)
                .collect(Collectors.toList());
        return buildResponse(wallet, txs);
    }

    @Transactional(readOnly = true)
    public List<TransactionDto> listTransactions(String email) {
        Long userId = currentUserId(email);
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException("Wallet not found", HttpStatus.NOT_FOUND.value()));
        return txRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId())
                .stream()
                .map(TransactionDto::from)
                .collect(Collectors.toList());
    }

    private Wallet getOrCreateWallet(Long userId) {
        return walletRepository.findByUserId(userId)
                .orElseGet(() -> walletRepository.save(new Wallet(userId)));
    }

    private WalletResponse buildResponse(Wallet wallet, List<TransactionDto> txs) {
        WalletResponse r = new WalletResponse();
        r.setBalance(wallet.getBalance());
        r.setAutoTopupEnabled(wallet.getAutoTopupEnabled());
        r.setAutoTopupThreshold(wallet.getAutoTopupThreshold());
        r.setAutoTopupAmount(wallet.getAutoTopupAmount());
        r.setTransactions(txs);
        return r;
    }

    private Long currentUserId(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND.value()));
        return user.getId();
    }
}