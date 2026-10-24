package com.carpooling.dto;

import com.carpooling.model.Ride;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class RideResponse {
    private Long id;
    private Long driverId;
    private String origin;
    private String destination;
    private LocalDateTime departureTime;
    private BigDecimal price;
    private Integer seatsAvailable;
    private String note;
    private String status;

    public static RideResponse from(Ride ride) {
        RideResponse r = new RideResponse();
        r.id = ride.getId();
        r.driverId = ride.getDriverId();
        r.origin = ride.getOrigin();
        r.destination = ride.getDestination();
        r.departureTime = ride.getDepartureTime();
        r.price = ride.getPrice();
        r.seatsAvailable = ride.getSeatsAvailable();
        r.note = ride.getNote();
        r.status = ride.getStatus() != null ? ride.getStatus().name() : null;
        return r;
    }

    // Getters
    public Long getId() { return id; }
    public Long getDriverId() { return driverId; }
    public String getOrigin() { return origin; }
    public String getDestination() { return destination; }
    public LocalDateTime getDepartureTime() { return departureTime; }
    public BigDecimal getPrice() { return price; }
    public Integer getSeatsAvailable() { return seatsAvailable; }
    public String getNote() { return note; }
    public String getStatus() { return status; }
}