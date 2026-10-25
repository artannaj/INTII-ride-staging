package com.carpooling.dto;

public class CreateBookingRequest {
    private Long rideId;
    private Integer seatsBooked;
    private String paymentMethod; // "WALLET" (default) or "CASH"

    public Long getRideId() { return rideId; }
    public void setRideId(Long rideId) { this.rideId = rideId; }
    public Integer getSeatsBooked() { return seatsBooked; }
    public void setSeatsBooked(Integer seatsBooked) { this.seatsBooked = seatsBooked; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
}
