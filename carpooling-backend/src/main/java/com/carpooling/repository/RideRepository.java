package com.carpooling.repository;

import com.carpooling.model.Ride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface RideRepository extends JpaRepository<Ride, Long> {

    // Partial, case-insensitive match so "aeon" finds "Nilai AEON Mall"
    @Query("""
            SELECT r FROM Ride r
            WHERE LOWER(r.origin) LIKE LOWER(CONCAT('%', :origin, '%'))
              AND LOWER(r.destination) LIKE LOWER(CONCAT('%', :destination, '%'))
              AND r.status = com.carpooling.model.Ride.Status.ACTIVE
              AND r.departureTime >= :after
            ORDER BY r.departureTime ASC
            """)
    List<Ride> search(@Param("origin") String origin,
                      @Param("destination") String destination,
                      @Param("after") LocalDateTime after);

    List<Ride> findByStatusAndDepartureTimeAfterOrderByDepartureTimeAsc(
            Ride.Status status, LocalDateTime after);

    List<Ride> findByDriverIdOrderByDepartureTimeDesc(Long driverId);

    List<Ride> findByDriverIdAndStatusIn(Long driverId, Collection<Ride.Status> statuses);
}
