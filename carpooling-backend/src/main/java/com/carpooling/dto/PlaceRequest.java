package com.carpooling.dto;

public class PlaceRequest {

    private String label;
    private String address;
    private String icon;

    public PlaceRequest() {
    }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
}