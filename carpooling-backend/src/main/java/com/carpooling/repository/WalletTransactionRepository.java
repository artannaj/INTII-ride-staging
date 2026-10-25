package com.carpooling.repository;

import com.carpooling.model.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {

    List<WalletTransaction> findByWalletIdOrderByCreatedAtDesc(Long walletId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM WalletTransaction t WHERE t.walletId = :walletId AND t.type = :type")
    BigDecimal sumByWalletIdAndType(@Param("walletId") Long walletId, @Param("type") WalletTransaction.Type type);
}
