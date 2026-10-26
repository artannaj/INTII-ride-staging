package com.carpooling.repository;

import com.carpooling.model.Wallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface WalletRepository extends JpaRepository<Wallet, Long> {

    Optional<Wallet> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    // Race-safe creation: concurrent callers can't hit the unique user_id constraint
    @Modifying
    @Query(value = "INSERT IGNORE INTO wallets (user_id, balance, auto_topup_enabled, auto_topup_threshold, "
            + "auto_topup_amount, updated_at) VALUES (:userId, 0, false, 5.00, 20.00, NOW())", nativeQuery = true)
    int insertIfMissing(@Param("userId") Long userId);

    // Row lock so two concurrent balance changes can't overwrite each other
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.userId = :userId")
    Optional<Wallet> findByUserIdForUpdate(@Param("userId") Long userId);
}
