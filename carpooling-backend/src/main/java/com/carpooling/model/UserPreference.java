package com.carpooling.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_preferences")
public class UserPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "quiet_ride")
    private Boolean quietRide = false;

    @Column(name = "ac_on")
    private Boolean acOn = true;

    @Column(name = "music_ok")
    private Boolean musicOk = false;

    @Column(name = "women_only")
    private Boolean womenOnly = false;

    @Column(name = "luggage_space")
    private Boolean luggageSpace = false;

    @Column(name = "pet_friendly")
    private Boolean petFriendly = false;

    @Column(name = "notify_ride_updates")
    private Boolean notifyRideUpdates = true;

    @Column(name = "notify_payments")
    private Boolean notifyPayments = true;

    @Column(name = "notify_promos")
    private Boolean notifyPromos = false;

    @Column(name = "notify_reminders")
    private Boolean notifyReminders = true;

    public UserPreference() {
    }

    public UserPreference(Long userId) {
        this.userId = userId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

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