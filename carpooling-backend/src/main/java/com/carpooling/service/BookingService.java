package com.carpooling.service;

import com.carpooling.dto.BookingResponse;
import com.carpooling.dto.CreateBookingRequest;
import com.carpooling.exception.ApiException;
import com.carpooling.model.Booking;
import com.carpooling.model.Ride;
import com.carpooling.model.User;
import com.carpooling.repository.BookingRepository;
import com.carpooling.repository.RideRepository;
import com.carpooling.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {
    private final BookingRepository bookingRepository;
    private final RideRepository rideRepository;
    private final UserRepository userRepository;

    public BookingService(BookingRepository bookingRepository, RideRepository rideRepository, UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.rideRepository = rideRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public BookingResponse createBooking(String email, CreateBookingRequest request) {
        User passenger = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("Passenger not found", HttpStatus.NOT_FOUND.value()));

        Ride ride = rideRepository.findById(request.getRideId())
                .orElseThrow(() -> new ApiException("Ride not found", HttpStatus.NOT_FOUND.value()));

        int seats = request.getSeatsBooked() != null ? request.getSeatsBooked() : 1;

        if (ride.getSeatsAvailable() < seats) {
            throw new ApiException("Not enough seats available", HttpStatus.BAD_REQUEST.value());
        }

        // Deduct seats from the ride
        ride.setSeatsAvailable(ride.getSeatsAvailable() - seats);
        if (ride.getSeatsAvailable() == 0) {
            ride.setStatus(Ride.Status.FULL);
        }
        rideRepository.save(ride);

        // Calculate total price
        BigDecimal totalPrice = ride.getPrice().multiply(new BigDecimal(seats));

        Booking booking = Booking.builder()
                .rideId(ride.getId())
                .passengerId(passenger.getId())
                .seatsBooked(seats)
                .totalPrice(totalPrice)
                .status(Booking.Status.PENDING)
                .build();

        bookingRepository.save(booking);
        return BookingResponse.from(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(String email) {
        User passenger = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("Passenger not found", HttpStatus.NOT_FOUND.value()));

        return bookingRepository.findByPassengerIdOrderByCreatedAtDesc(passenger.getId())
                .stream()
                .map(BookingResponse::from)
                .collect(Collectors.toList());
    }
}