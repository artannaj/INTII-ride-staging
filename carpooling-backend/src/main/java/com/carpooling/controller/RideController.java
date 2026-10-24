package com.carpooling.controller;

import com.carpooling.dto.CreateRideRequest;
import com.carpooling.dto.RideResponse;
import com.carpooling.service.RideService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rides")
public class RideController {
    private final RideService rideService;

    public RideController(RideService rideService) {
        this.rideService = rideService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<RideResponse>> search(
            @RequestParam String origin,
            @RequestParam String destination) {
        return ResponseEntity.ok(rideService.searchRides(origin, destination));
    }

    @PostMapping
    public ResponseEntity<RideResponse> createRide(
            Authentication authentication,
            @RequestBody CreateRideRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(rideService.createRide(authentication.getName(), request));
    }
}