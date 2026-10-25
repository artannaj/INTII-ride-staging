package com.carpooling.dto;

import com.carpooling.model.User;

public record DriverProfileResponse(
        String role,
        String vehicleModel,
        String vehicleColor,
        String vehiclePlate,
        boolean complete
) {
    public static DriverProfileResponse from(User u) {
        boolean complete = u.getVehiclePlate() != null && !u.getVehiclePlate().isBlank();
        return new DriverProfileResponse(u.getRole().name(), u.getVehicleModel(), u.getVehicleColor(),
                u.getVehiclePlate(), complete);
    }
}
