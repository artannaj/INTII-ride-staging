package com.carpooling.dto;

import com.carpooling.model.WalletTransaction;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TransactionDto {

    private Long id;
    private String type;
    private BigDecimal amount;
    private String description;
    private String status;
    private String reference;
    private LocalDateTime createdAt;

    public TransactionDto() {
    }

    public static TransactionDto from(WalletTransaction t) {
        TransactionDto d = new TransactionDto();
        d.id = t.getId();
        d.type = t.getType() != null ? t.getType().name() : null;
        d.amount = t.getAmount();
        d.description = t.getDescription();
        d.status = t.getStatus() != null ? t.getStatus().name() : null;
        d.reference = t.getReference();
        d.createdAt = t.getCreatedAt();
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}