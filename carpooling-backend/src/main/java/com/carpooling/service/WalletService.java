package com.carpooling.service;

import com.carpooling.dto.TopUpRequest;
import com.carpooling.dto.TransactionDto;
import com.carpooling.dto.WalletResponse;
import com.carpooling.exception.ApiException;
import com.carpooling.model.Booking;
import com.carpooling.model.PaymentMethod;
import com.carpooling.model.User;
import com.carpooling.model.Wallet;
import com.carpooling.model.WalletTransaction;
import com.carpooling.repository.PaymentMethodRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.repository.WalletRepository;
import com.carpooling.repository.WalletTransactionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Campus Wallet ledger. Every balance change goes through {@link #apply}, which
 * locks the wallet row and records a signed transaction (credits positive,
 * debits negative), so the history always adds up to the balance.
 *
 * Top-ups are simulated: no real payment gateway is charged.
 */
@Service
public class WalletService {
    static final BigDecimal MIN_TOPUP = new BigDecimal("1.00");
    static final BigDecimal MAX_TOPUP = new BigDecimal("500.00");
    static final BigDecimal MAX_BALANCE = new BigDecimal("2000.00");

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository txRepository;
    private final UserRepository userRepository;
    private final PaymentMethodRepository paymentMethodRepository;

    public WalletService(WalletRepository walletRepository,
                         WalletTransactionRepository txRepository,
                         UserRepository userRepository,
                         PaymentMethodRepository paymentMethodRepository) {
        this.walletRepository = walletRepository;
        this.txRepository = txRepository;
        this.userRepository = userRepository;
        this.paymentMethodRepository = paymentMethodRepository;
    }

    @Transactional
    public WalletResponse getWallet(String email) {
        Long userId = currentUserId(email);
        walletRepository.insertIfMissing(userId);
        return buildResponse(walletRepository.findByUserId(userId).orElseThrow());
    }

    /**
     * Creates the wallet in its own short transaction. Call before {@link #topUp}
     * so the locking read never targets a missing row, which in MySQL takes a
     * gap lock and deadlocks concurrent first-time top-ups.
     */
    @Transactional
    public void ensureWallet(String email) {
        walletRepository.insertIfMissing(currentUserId(email));
    }

    @Transactional
    public WalletResponse topUp(String email, TopUpRequest request) {
        Long userId = currentUserId(email);
        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(MIN_TOPUP) < 0) {
            throw badRequest("Top up at least RM " + MIN_TOPUP);
        }
        if (amount.compareTo(MAX_TOPUP) > 0) {
            throw badRequest("You can top up at most RM " + MAX_TOPUP + " at a time");
        }
        if (amount.stripTrailingZeros().scale() > 2) {
            throw badRequest("Amount can't have more than 2 decimal places");
        }

        if (request.getPaymentMethodId() == null) {
            throw badRequest("Choose a payment method to top up from");
        }
        PaymentMethod method = paymentMethodRepository.findById(request.getPaymentMethodId())
                .filter(m -> m.getUserId().equals(userId))
                .orElseThrow(() -> new ApiException("Payment method not found", HttpStatus.NOT_FOUND.value()));
        if (method.getType() == PaymentMethod.Type.CASH) {
            throw badRequest("Cash can't be used to top up the wallet");
        }

        Wallet wallet = lockedWallet(userId);
        if (wallet.getBalance().add(amount).compareTo(MAX_BALANCE) > 0) {
            throw badRequest("Wallet balance can't exceed RM " + MAX_BALANCE);
        }
        apply(wallet, WalletTransaction.Type.TOPUP, amount, "Top-up via " + method.getProvider(), null);
        return buildResponse(wallet);
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

    @Transactional(readOnly = true)
    public BigDecimal balanceOf(Long userId) {
        return walletRepository.findByUserId(userId).map(Wallet::getBalance).orElse(BigDecimal.ZERO);
    }

    /* ---------- Ride payments (called inside booking/ride transactions) ---------- */

    /** Takes the fare from the passenger when they request a seat paid by wallet. */
    @Transactional
    public void chargeBooking(Booking booking, String rideLabel) {
        Wallet wallet = lockedWallet(booking.getPassengerId());
        if (wallet.getBalance().compareTo(booking.getTotalPrice()) < 0) {
            throw new ApiException(
                    "Not enough wallet balance (RM " + wallet.getBalance() + "). Top up or choose cash.",
                    HttpStatus.PAYMENT_REQUIRED.value());
        }
        apply(wallet, WalletTransaction.Type.RIDE_PAYMENT, booking.getTotalPrice().negate(),
                "Ride " + rideLabel, booking.getId());
        booking.setPaymentStatus(Booking.PaymentStatus.PAID);
    }

    /** Returns the fare if it was taken from the wallet and hasn't been refunded or paid out. */
    @Transactional
    public void refundBooking(Booking booking, String reason) {
        if (booking.getPaymentStatus() != Booking.PaymentStatus.PAID) return;
        Wallet wallet = lockedWallet(booking.getPassengerId());
        apply(wallet, WalletTransaction.Type.REFUND, booking.getTotalPrice(),
                "Refund: " + reason, booking.getId());
        booking.setPaymentStatus(Booking.PaymentStatus.REFUNDED);
    }

    /** Credits the driver once the trip is completed. */
    @Transactional
    public void payOutBooking(Booking booking, Long driverId, String rideLabel) {
        if (booking.getPaymentStatus() != Booking.PaymentStatus.PAID) return;
        Wallet wallet = lockedWallet(driverId);
        apply(wallet, WalletTransaction.Type.DRIVER_EARNING, booking.getTotalPrice(),
                "Earning: " + rideLabel, booking.getId());
        booking.setPaymentStatus(Booking.PaymentStatus.PAID_OUT);
    }

    /* ---------- Helpers ---------- */

    private void apply(Wallet wallet, WalletTransaction.Type type, BigDecimal signedAmount,
                       String description, Long bookingId) {
        wallet.setBalance(wallet.getBalance().add(signedAmount));
        walletRepository.save(wallet);

        String ref = "INT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        WalletTransaction tx = new WalletTransaction(wallet.getId(), type, signedAmount, description, ref);
        tx.setBookingId(bookingId);
        txRepository.save(tx);
    }

    private Wallet lockedWallet(Long userId) {
        // Only locks an existing row; creates it first if needed (e.g. a driver's first payout)
        if (!walletRepository.existsByUserId(userId)) {
            walletRepository.insertIfMissing(userId);
        }
        return walletRepository.findByUserIdForUpdate(userId).orElseThrow();
    }

    private WalletResponse buildResponse(Wallet wallet) {
        List<TransactionDto> txs = txRepository
                .findByWalletIdOrderByCreatedAtDesc(wallet.getId())
                .stream()
                .map(TransactionDto::from)
                .collect(Collectors.toList());
        WalletResponse r = new WalletResponse();
        r.setBalance(wallet.getBalance());
        r.setAutoTopupEnabled(wallet.getAutoTopupEnabled());
        r.setAutoTopupThreshold(wallet.getAutoTopupThreshold());
        r.setAutoTopupAmount(wallet.getAutoTopupAmount());
        r.setTotalEarned(txRepository.sumByWalletIdAndType(wallet.getId(), WalletTransaction.Type.DRIVER_EARNING));
        r.setTransactions(txs);
        return r;
    }

    private Long currentUserId(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND.value()));
        return user.getId();
    }

    private static ApiException badRequest(String message) {
        return new ApiException(message, HttpStatus.BAD_REQUEST.value());
    }
}
