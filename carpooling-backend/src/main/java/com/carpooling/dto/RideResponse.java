package com.carpooling.dto;

import com.carpooling.model.Ride;
import com.carpooling.model.User;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class RideResponse {
    private Long id;
    private Long driverId;
    private String driverName;
    private String vehicle;
    private String origin;
    private String destination;
    private Double originLat;
    private Double originLng;
    private Double destinationLat;
    private Double destinationLng;
    private LocalDateTime departureTime;
    private BigDecimal price;
    private Integer seatsAvailable;
    private String note;
    private String status;
    private Integer pendingRequests;

    public static RideResponse from(Ride ride) {
        return from(ride, null);
    }

    public static RideResponse from(Ride ride, User driver) {
        RideResponse r = new RideResponse();
        r.id = ride.getId();
        r.driverId = ride.getDriverId();
        r.driverName = displayName(driver);
        r.vehicle = vehicleSummary(driver);
        r.origin = ride.getOrigin();
        r.destination = ride.getDestination();
        r.originLat = ride.getOriginLat();
        r.originLng = ride.getOriginLng();
        r.destinationLat = ride.getDestinationLat();
        r.destinationLng = ride.getDestinationLng();
        r.departureTime = ride.getDepartureTime();
        r.price = ride.getPrice();
        r.seatsAvailable = ride.getSeatsAvailable();
        r.note = ride.getNote();
        r.status = ride.getStatus() != null ? ride.getStatus().name() : null;
        return r;
    }

    public static String displayName(User user) {
        if (user == null) return null;
        if (user.getFullName() != null && !user.getFullName().isBlank()) return user.getFullName();
        return user.getUsername();
    }

    /** e.g. "Perodua Myvi · Silver · VGX 2041", or null if the driver hasn't set one up. */
    public static String vehicleSummary(User driver) {
        if (driver == null || driver.getVehiclePlate() == null || driver.getVehiclePlate().isBlank()) return null;
        StringBuilder sb = new StringBuilder();
        if (driver.getVehicleModel() != null && !driver.getVehicleModel().isBlank()) sb.append(driver.getVehicleModel()).append(" · ");
        if (driver.getVehicleColor() != null && !driver.getVehicleColor().isBlank()) sb.append(driver.getVehicleColor()).append(" · ");
        sb.append(driver.getVehiclePlate());
        return sb.toString();
    }

    public RideResponse withPendingRequests(int count) {
        this.pendingRequests = count;
        return this;
    }

    // Getters
    public Long getId() { return id; }
    public Long getDriverId() { return driverId; }
    public String getDriverName() { return driverName; }
    public String getVehicle() { return vehicle; }
    public String getOrigin() { return origin; }
    public String getDestination() { return destination; }
    public Double getOriginLat() { return originLat; }
    public Double getOriginLng() { return originLng; }
    public Double getDestinationLat() { return destinationLat; }
    public Double getDestinationLng() { return destinationLng; }
    public LocalDateTime getDepartureTime() { return departureTime; }
    public BigDecimal getPrice() { return price; }
    public Integer getSeatsAvailable() { return seatsAvailable; }
    public String getNote() { return note; }
    public String getStatus() { return status; }
    public Integer getPendingRequests() { return pendingRequests; }
}
