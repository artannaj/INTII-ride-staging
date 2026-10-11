package com.carpooling.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "referrals")
public class Referral {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "referrer_id", nullable = false)
    private Long referrerId;

    @Column(name = "referred_email", length = 120)
    private String referredEmail;

    @Column(name = "referred_user_id")
    private Long referredUserId;

    @Column(nullable = false, length = 20)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status = Status.PENDING;

    @Column(name = "reward_amount", precision = 10, scale = 2)
    private BigDecimal rewardAmount = new BigDecimal("5.00");

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = Status.PENDING;
        if (rewardAmount == null) rewardAmount = new BigDecimal("5.00");
    }

    public Referral() {
    }

    public Referral(Long referrerId, String referredEmail, String code) {
        this.referrerId = referrerId;
        this.referredEmail = referredEmail;
        this.code = code;
        this.status = Status.PENDING;
        this.rewardAmount = new BigDecimal("5.00");
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getReferrerId() { return referrerId; }
    public void setReferrerId(Long referrerId) { this.referrerId = referrerId; }

    public String getReferredEmail() { return referredEmail; }
    public void setReferredEmail(String referredEmail) { this.referredEmail = referredEmail; }

    public Long getReferredUserId() { return referredUserId; }
    public void setReferredUserId(Long referredUserId) { this.referredUserId = referredUserId; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public BigDecimal getRewardAmount() { return rewardAmount; }
    public void setRewardAmount(BigDecimal rewardAmount) { this.rewardAmount = rewardAmount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public enum Status {
        PENDING,
        COMPLETED,
        EXPIRED
    }
}