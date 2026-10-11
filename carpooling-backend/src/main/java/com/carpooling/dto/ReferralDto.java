package com.carpooling.dto;

import com.carpooling.model.Referral;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ReferralDto {

    private Long id;
    private String referredEmail;
    private String code;
    private String status;
    private BigDecimal rewardAmount;
    private LocalDateTime createdAt;

    public ReferralDto() {
    }

    public static ReferralDto from(Referral r) {
        ReferralDto d = new ReferralDto();
        d.id = r.getId();
        d.referredEmail = r.getReferredEmail();
        d.code = r.getCode();
        d.status = r.getStatus() != null ? r.getStatus().name() : null;
        d.rewardAmount = r.getRewardAmount();
        d.createdAt = r.getCreatedAt();
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getReferredEmail() { return referredEmail; }
    public void setReferredEmail(String referredEmail) { this.referredEmail = referredEmail; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getRewardAmount() { return rewardAmount; }
    public void setRewardAmount(BigDecimal rewardAmount) { this.rewardAmount = rewardAmount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}