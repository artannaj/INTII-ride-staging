package com.carpooling.repository;

import com.carpooling.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    // Get all bookings made by a specific passenger (newest first)
    List<Booking> findByPassengerIdOrderByCreatedAtDesc(Long passengerId);
}