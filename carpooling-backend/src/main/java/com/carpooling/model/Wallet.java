package com.carpooling.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "wallets")
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(precision = 10, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "auto_topup_enabled")
    private Boolean autoTopupEnabled = false;

    @Column(name = "auto_topup_threshold", precision = 10, scale = 2)
    private BigDecimal autoTopupThreshold = new BigDecimal("5.00");

    @Column(name = "auto_topup_amount", precision = 10, scale = 2)
    private BigDecimal autoTopupAmount = new BigDecimal("20.00");

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void prePersist() {
        updatedAt = LocalDateTime.now();
        if (balance == null) balance = BigDecimal.ZERO;
        if (autoTopupEnabled == null) autoTopupEnabled = false;
        if (autoTopupThreshold == null) autoTopupThreshold = new BigDecimal("5.00");
        if (autoTopupAmount == null) autoTopupAmount = new BigDecimal("20.00");
    }

    public Wallet() {
    }

    public Wallet(Long userId) {
        this.userId = userId;
        this.balance = BigDecimal.ZERO;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }

    public Boolean getAutoTopupEnabled() { return autoTopupEnabled; }
    public void setAutoTopupEnabled(Boolean autoTopupEnabled) { this.autoTopupEnabled = autoTopupEnabled; }

    public BigDecimal getAutoTopupThreshold() { return autoTopupThreshold; }
    public void setAutoTopupThreshold(BigDecimal autoTopupThreshold) { this.autoTopupThreshold = autoTopupThreshold; }

    public BigDecimal getAutoTopupAmount() { return autoTopupAmount; }
    public void setAutoTopupAmount(BigDecimal autoTopupAmount) { this.autoTopupAmount = autoTopupAmount; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}