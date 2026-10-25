package com.carpooling.dto;

import java.math.BigDecimal;
import java.util.List;

public class WalletResponse {

    private BigDecimal balance;
    private Boolean autoTopupEnabled;
    private BigDecimal autoTopupThreshold;
    private BigDecimal autoTopupAmount;
    private BigDecimal totalEarned;
    private List<TransactionDto> transactions;

    public WalletResponse() {
    }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }

    public Boolean getAutoTopupEnabled() { return autoTopupEnabled; }
    public void setAutoTopupEnabled(Boolean autoTopupEnabled) { this.autoTopupEnabled = autoTopupEnabled; }

    public BigDecimal getAutoTopupThreshold() { return autoTopupThreshold; }
    public void setAutoTopupThreshold(BigDecimal autoTopupThreshold) { this.autoTopupThreshold = autoTopupThreshold; }

    public BigDecimal getTotalEarned() { return totalEarned; }
    public void setTotalEarned(BigDecimal totalEarned) { this.totalEarned = totalEarned; }

    public BigDecimal getAutoTopupAmount() { return autoTopupAmount; }
    public void setAutoTopupAmount(BigDecimal autoTopupAmount) { this.autoTopupAmount = autoTopupAmount; }

    public List<TransactionDto> getTransactions() { return transactions; }
    public void setTransactions(List<TransactionDto> transactions) { this.transactions = transactions; }
}