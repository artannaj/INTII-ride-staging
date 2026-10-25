package com.carpooling.dto;

import java.time.LocalDateTime;

public record MessageResponse(
        Long id,
        Long bookingId,
        Long senderId,
        String senderName,
        boolean mine,
        String message,
        LocalDateTime createdAt
) {}
