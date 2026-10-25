package com.carpooling.dto;

import java.time.LocalDateTime;

public record ConversationResponse(
        Long bookingId,
        Long rideId,
        String otherName,
        // "DRIVER" when the other person drives, "PASSENGER" otherwise
        String otherRole,
        String origin,
        String destination,
        LocalDateTime departureTime,
        String bookingStatus,
        String lastMessage,
        LocalDateTime lastMessageAt
) {}
