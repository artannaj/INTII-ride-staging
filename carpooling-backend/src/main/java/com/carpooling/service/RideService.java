package com.carpooling.service;

import com.carpooling.dto.CreateRideRequest;
import com.carpooling.dto.RideResponse;
import com.carpooling.exception.ApiException;
import com.carpooling.model.Ride;
import com.carpooling.model.User;
import com.carpooling.repository.RideRepository;
import com.carpooling.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RideService {
    private final RideRepository rideRepository;
    private final UserRepository userRepository;

    public RideService(RideRepository rideRepository, UserRepository userRepository) {
        this.rideRepository = rideRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<RideResponse> searchRides(String origin, String destination) {
        return rideRepository.findByOriginAndDestinationAndStatusOrderByDepartureTimeAsc(
                origin, destination, Ride.Status.ACTIVE)
                .stream()
                .map(RideResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public RideResponse createRide(String email, CreateRideRequest request) {
        User driver = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND.value()));

        Ride ride = Ride.builder()
                .driverId(driver.getId())
                .origin(request.getOrigin())
                .destination(request.getDestination())
                .departureTime(request.getDepartureTime())
                .price(request.getPrice())
                .seatsAvailable(request.getSeatsAvailable())
                .note(request.getNote())
                .status(Ride.Status.ACTIVE)
                .build();

        rideRepository.save(ride);
        return RideResponse.from(ride);
    }
}