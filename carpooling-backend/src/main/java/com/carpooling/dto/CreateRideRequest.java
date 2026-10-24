package com.carpooling.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CreateRideRequest {
    private String origin;
    private String destination;
    private LocalDateTime departureTime;
    private BigDecimal price;
    private Integer seatsAvailable;
    private String note;

    // Getters and Setters
    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }
    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }
    public LocalDateTime getDepartureTime() { return departureTime; }
    public void setDepartureTime(LocalDateTime departureTime) { this.departureTime = departureTime; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public Integer getSeatsAvailable() { return seatsAvailable; }
    public void setSeatsAvailable(Integer seatsAvailable) { this.seatsAvailable = seatsAvailable; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}