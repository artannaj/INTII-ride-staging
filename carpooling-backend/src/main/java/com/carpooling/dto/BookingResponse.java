package com.carpooling.dto;

import com.carpooling.model.Booking;
import com.carpooling.model.Ride;
import com.carpooling.model.User;
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
    private String paymentMethod;
    private String paymentStatus;

    // Ride summary so list screens don't need a second request per booking
    private String origin;
    private String destination;
    private LocalDateTime departureTime;
    private String rideStatus;
    private Long driverId;
    private String driverName;
    private String vehicle;
    private String passengerName;

    // Phone numbers are only shared once the driver has accepted the booking
    private String driverPhone;
    private String passengerPhone;

    public static BookingResponse from(Booking b) {
        return from(b, null, null, null);
    }

    public static BookingResponse from(Booking b, Ride ride, User driver, User passenger) {
        BookingResponse r = new BookingResponse();
        r.id = b.getId();
        r.rideId = b.getRideId();
        r.passengerId = b.getPassengerId();
        r.seatsBooked = b.getSeatsBooked();
        r.totalPrice = b.getTotalPrice();
        r.status = b.getStatus() != null ? b.getStatus().name() : null;
        r.createdAt = b.getCreatedAt();
        r.paymentMethod = b.getPaymentMethod() != null ? b.getPaymentMethod().name() : Booking.PaymentMethod.CASH.name();
        r.paymentStatus = b.getPaymentStatus() != null ? b.getPaymentStatus().name() : Booking.PaymentStatus.CASH_ON_PICKUP.name();

        if (ride != null) {
            r.origin = ride.getOrigin();
            r.destination = ride.getDestination();
            r.departureTime = ride.getDepartureTime();
            r.rideStatus = ride.getStatus() != null ? ride.getStatus().name() : null;
            r.driverId = ride.getDriverId();
        }
        r.driverName = RideResponse.displayName(driver);
        r.vehicle = RideResponse.vehicleSummary(driver);
        r.passengerName = RideResponse.displayName(passenger);

        boolean shareContact = b.getStatus() == Booking.Status.CONFIRMED;
        if (shareContact) {
            r.driverPhone = driver != null ? driver.getPhone() : null;
            r.passengerPhone = passenger != null ? passenger.getPhone() : null;
        }
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
    public String getPaymentMethod() { return paymentMethod; }
    public String getPaymentStatus() { return paymentStatus; }
    public String getOrigin() { return origin; }
    public String getDestination() { return destination; }
    public LocalDateTime getDepartureTime() { return departureTime; }
    public String getRideStatus() { return rideStatus; }
    public Long getDriverId() { return driverId; }
    public String getDriverName() { return driverName; }
    public String getVehicle() { return vehicle; }
    public String getPassengerName() { return passengerName; }
    public String getDriverPhone() { return driverPhone; }
    public String getPassengerPhone() { return passengerPhone; }
}
