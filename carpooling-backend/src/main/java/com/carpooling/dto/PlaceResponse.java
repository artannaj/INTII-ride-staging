package com.carpooling.dto;

import com.carpooling.model.SavedPlace;

public class PlaceResponse {

    private Long id;
    private String label;
    private String address;
    private String icon;

    public PlaceResponse() {
    }

    public static PlaceResponse from(SavedPlace p) {
        PlaceResponse r = new PlaceResponse();
        r.id = p.getId();
        r.label = p.getLabel();
        r.address = p.getAddress();
        r.icon = p.getIcon();
        return r;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
}