package com.carpooling.controller;

import com.carpooling.dto.BookingResponse;
import com.carpooling.dto.CreateRideRequest;
import com.carpooling.dto.LocationUpdateRequest;
import com.carpooling.dto.RideResponse;
import com.carpooling.dto.TrackingResponse;
import com.carpooling.service.RideService;
import jakarta.validation.Valid;
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
            @RequestParam(defaultValue = "") String origin,
            @RequestParam(defaultValue = "") String destination) {
        return ResponseEntity.ok(rideService.searchRides(origin, destination));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<RideResponse>> upcoming() {
        return ResponseEntity.ok(rideService.upcomingRides());
    }

    @GetMapping("/mine")
    public ResponseEntity<List<RideResponse>> mine(Authentication authentication) {
        return ResponseEntity.ok(rideService.myRides(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RideResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(rideService.getRide(id));
    }

    @PostMapping
    public ResponseEntity<RideResponse> createRide(
            Authentication authentication,
            @RequestBody CreateRideRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(rideService.createRide(authentication.getName(), request));
    }

    @GetMapping("/{id}/bookings")
    public ResponseEntity<List<BookingResponse>> bookings(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(rideService.rideBookings(authentication.getName(), id));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<RideResponse> start(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(rideService.startRide(authentication.getName(), id));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<RideResponse> complete(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(rideService.completeRide(authentication.getName(), id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<RideResponse> cancel(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(rideService.cancelRide(authentication.getName(), id));
    }

    @PutMapping("/{id}/location")
    public ResponseEntity<Void> updateLocation(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody LocationUpdateRequest request) {
        rideService.updateLocation(authentication.getName(), id, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/tracking")
    public ResponseEntity<TrackingResponse> tracking(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(rideService.tracking(authentication.getName(), id));
    }
}
