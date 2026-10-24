package com.carpooling.repository;

import com.carpooling.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    // Get chat history for a specific booking
    List<Message> findByBookingIdOrderByCreatedAtAsc(Long bookingId);
}