package com.carpooling.repository;

import com.carpooling.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    // Get all bookings made by a specific passenger (newest first)
    List<Booking> findByPassengerIdOrderByCreatedAtDesc(Long passengerId);

    List<Booking> findByRideIdOrderByCreatedAtAsc(Long rideId);

    List<Booking> findByRideIdAndStatusIn(Long rideId, Collection<Booking.Status> statuses);

    List<Booking> findByRideIdInOrderByCreatedAtDesc(Collection<Long> rideIds);

    boolean existsByRideIdAndPassengerIdAndStatusIn(Long rideId, Long passengerId, Collection<Booking.Status> statuses);
}
