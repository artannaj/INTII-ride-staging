package com.carpooling.dto;

import java.math.BigDecimal;
import java.util.List;

public class ReferralResponse {

    private String code;
    private Integer invitedCount;
    private Integer completedCount;
    private BigDecimal totalEarned;
    private List<ReferralDto> referrals;

    public ReferralResponse() {
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Integer getInvitedCount() { return invitedCount; }
    public void setInvitedCount(Integer invitedCount) { this.invitedCount = invitedCount; }

    public Integer getCompletedCount() { return completedCount; }
    public void setCompletedCount(Integer completedCount) { this.completedCount = completedCount; }

    public BigDecimal getTotalEarned() { return totalEarned; }
    public void setTotalEarned(BigDecimal totalEarned) { this.totalEarned = totalEarned; }

    public List<ReferralDto> getReferrals() { return referrals; }
    public void setReferrals(List<ReferralDto> referrals) { this.referrals = referrals; }
}