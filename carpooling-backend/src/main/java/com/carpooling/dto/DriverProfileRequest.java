package com.carpooling.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DriverProfileRequest(
        @NotBlank(message = "Vehicle model is required") @Size(max = 60) String vehicleModel,
        @NotBlank(message = "Vehicle colour is required") @Size(max = 30) String vehicleColor,
        @NotBlank(message = "Plate number is required") @Size(max = 15) String vehiclePlate
) {}
