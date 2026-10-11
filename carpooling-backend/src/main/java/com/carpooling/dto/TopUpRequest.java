package com.carpooling.dto;

import java.math.BigDecimal;

public class TopUpRequest {

    private BigDecimal amount;
    private String paymentMethod;

    public TopUpRequest() {
    }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
}