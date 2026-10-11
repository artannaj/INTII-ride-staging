package com.carpooling.dto;

import com.carpooling.model.PaymentMethod;

public class PaymentMethodDto {

    private Long id;
    private String type;
    private String provider;
    private String accountRef;
    private Boolean isDefault;
    private String expiryDate;

    public PaymentMethodDto() {
    }

    public static PaymentMethodDto from(PaymentMethod p) {
        PaymentMethodDto d = new PaymentMethodDto();
        d.id = p.getId();
        d.type = p.getType() != null ? p.getType().name() : null;
        d.provider = p.getProvider();
        d.accountRef = p.getAccountRef();
        d.isDefault = p.getIsDefault();
        d.expiryDate = p.getExpiryDate();
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getAccountRef() { return accountRef; }
    public void setAccountRef(String accountRef) { this.accountRef = accountRef; }

    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }

    public String getExpiryDate() { return expiryDate; }
    public void setExpiryDate(String expiryDate) { this.expiryDate = expiryDate; }
}