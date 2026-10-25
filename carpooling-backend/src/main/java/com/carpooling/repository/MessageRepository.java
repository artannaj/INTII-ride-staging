package com.carpooling.repository;

import com.carpooling.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {
    // Get chat history for a specific booking
    List<Message> findByBookingIdOrderByCreatedAtAsc(Long bookingId);

    // Only messages newer than the client's last seen id, for cheap polling
    List<Message> findByBookingIdAndIdGreaterThanOrderByCreatedAtAsc(Long bookingId, Long afterId);

    Optional<Message> findTopByBookingIdOrderByCreatedAtDesc(Long bookingId);
}
