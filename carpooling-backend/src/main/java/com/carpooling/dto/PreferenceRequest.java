package com.carpooling.dto;

public class PreferenceRequest {

    private Boolean quietRide;
    private Boolean acOn;
    private Boolean musicOk;
    private Boolean womenOnly;
    private Boolean luggageSpace;
    private Boolean petFriendly;
    private Boolean notifyRideUpdates;
    private Boolean notifyPayments;
    private Boolean notifyPromos;
    private Boolean notifyReminders;

    public PreferenceRequest() {
    }

    public Boolean getQuietRide() { return quietRide; }
    public void setQuietRide(Boolean quietRide) { this.quietRide = quietRide; }

    public Boolean getAcOn() { return acOn; }
    public void setAcOn(Boolean acOn) { this.acOn = acOn; }

    public Boolean getMusicOk() { return musicOk; }
    public void setMusicOk(Boolean musicOk) { this.musicOk = musicOk; }

    public Boolean getWomenOnly() { return womenOnly; }
    public void setWomenOnly(Boolean womenOnly) { this.womenOnly = womenOnly; }

    public Boolean getLuggageSpace() { return luggageSpace; }
    public void setLuggageSpace(Boolean luggageSpace) { this.luggageSpace = luggageSpace; }

    public Boolean getPetFriendly() { return petFriendly; }
    public void setPetFriendly(Boolean petFriendly) { this.petFriendly = petFriendly; }

    public Boolean getNotifyRideUpdates() { return notifyRideUpdates; }
    public void setNotifyRideUpdates(Boolean notifyRideUpdates) { this.notifyRideUpdates = notifyRideUpdates; }

    public Boolean getNotifyPayments() { return notifyPayments; }
    public void setNotifyPayments(Boolean notifyPayments) { this.notifyPayments = notifyPayments; }

    public Boolean getNotifyPromos() { return notifyPromos; }
    public void setNotifyPromos(Boolean notifyPromos) { this.notifyPromos = notifyPromos; }

    public Boolean getNotifyReminders() { return notifyReminders; }
    public void setNotifyReminders(Boolean notifyReminders) { this.notifyReminders = notifyReminders; }
}