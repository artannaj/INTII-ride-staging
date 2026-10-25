package com.carpooling.controller;

import com.carpooling.dto.BookingResponse;
import com.carpooling.dto.ConversationResponse;
import com.carpooling.dto.CreateBookingRequest;
import com.carpooling.dto.MessageRequest;
import com.carpooling.dto.MessageResponse;
import com.carpooling.service.BookingService;
import com.carpooling.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final BookingService bookingService;
    private final MessageService messageService;

    public BookingController(BookingService bookingService, MessageService messageService) {
        this.bookingService = bookingService;
        this.messageService = messageService;
    }

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            Authentication authentication,
            @RequestBody CreateBookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.createBooking(authentication.getName(), request));
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<List<BookingResponse>> getMyBookings(Authentication authentication) {
        return ResponseEntity.ok(bookingService.getMyBookings(authentication.getName()));
    }

    // Declared before /{id} so "conversations" isn't parsed as an id
    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> conversations(Authentication authentication) {
        return ResponseEntity.ok(messageService.conversations(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> get(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBooking(authentication.getName(), id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancel(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancelBooking(authentication.getName(), id));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<BookingResponse> accept(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(bookingService.acceptBooking(authentication.getName(), id));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<BookingResponse> reject(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(bookingService.rejectBooking(authentication.getName(), id));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<MessageResponse>> messages(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam(required = false) Long after) {
        return ResponseEntity.ok(messageService.list(authentication.getName(), id, after));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody MessageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messageService.send(authentication.getName(), id, request));
    }
}
