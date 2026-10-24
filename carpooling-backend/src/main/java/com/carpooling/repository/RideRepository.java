package com.carpooling.repository;

import com.carpooling.model.Ride;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RideRepository extends JpaRepository<Ride, Long> {
    // Find rides going from origin to destination that are still active
    List<Ride> findByOriginAndDestinationAndStatusOrderByDepartureTimeAsc(
        String origin, String destination, Ride.Status status);
}