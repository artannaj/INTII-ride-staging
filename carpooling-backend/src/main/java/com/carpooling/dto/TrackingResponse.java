package com.carpooling.dto;

public record TrackingResponse(
        Long rideId,
        String status,
        String driverName,
        String origin,
        String destination,
        Double originLat,
        Double originLng,
        Double destinationLat,
        Double destinationLng,
        Double currentLat,
        Double currentLng,
        // Computed server-side so client clock/timezone drift doesn't matter
        Long secondsSinceUpdate
) {}
