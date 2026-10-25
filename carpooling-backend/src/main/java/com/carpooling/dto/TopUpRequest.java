package com.carpooling.dto;

import java.math.BigDecimal;

public class TopUpRequest {
    private BigDecimal amount;
    // Saved payment method the money comes from (must belong to the user, not CASH)
    private Long paymentMethodId;

    public TopUpRequest() {
    }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public Long getPaymentMethodId() { return paymentMethodId; }
    public void setPaymentMethodId(Long paymentMethodId) { this.paymentMethodId = paymentMethodId; }
}
