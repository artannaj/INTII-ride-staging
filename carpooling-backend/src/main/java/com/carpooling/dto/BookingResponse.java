package com.carpooling.dto;

import com.carpooling.model.Booking;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class BookingResponse {
    private Long id;
    private Long rideId;
    private Long passengerId;
    private Integer seatsBooked;
    private BigDecimal totalPrice;
    private String status;
    private LocalDateTime createdAt;

    public static BookingResponse from(Booking b) {
        BookingResponse r = new BookingResponse();
        r.id = b.getId();
        r.rideId = b.getRideId();
        r.passengerId = b.getPassengerId();
        r.seatsBooked = b.getSeatsBooked();
        r.totalPrice = b.getTotalPrice();
        r.status = b.getStatus() != null ? b.getStatus().name() : null;
        r.createdAt = b.getCreatedAt();
        return r;
    }

    // Getters
    public Long getId() { return id; }
    public Long getRideId() { return rideId; }
    public Long getPassengerId() { return passengerId; }
    public Integer getSeatsBooked() { return seatsBooked; }
    public BigDecimal getTotalPrice() { return totalPrice; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}