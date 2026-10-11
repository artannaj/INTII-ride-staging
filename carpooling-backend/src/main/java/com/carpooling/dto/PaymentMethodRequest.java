package com.carpooling.dto;

public class PaymentMethodRequest {

    private String type;        // "CARD", "EWALLET", "BANK", "CASH"
    private String provider;    // e.g. "Visa •••• 4821", "Touch n Go eWallet"
    private String accountRef;  // masked number or account ref
    private String expiryDate;  // "MM/YY" for cards
    private Boolean isDefault;

    public PaymentMethodRequest() {
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getAccountRef() { return accountRef; }
    public void setAccountRef(String accountRef) { this.accountRef = accountRef; }

    public String getExpiryDate() { return expiryDate; }
    public void setExpiryDate(String expiryDate) { this.expiryDate = expiryDate; }

    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }
}