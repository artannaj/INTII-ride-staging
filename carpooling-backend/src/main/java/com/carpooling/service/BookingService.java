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
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class BookingService {
    private static final Set<Booking.Status> OPEN_BOOKINGS =
            EnumSet.of(Booking.Status.PENDING, Booking.Status.CONFIRMED);

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
        User passenger = findUser(email);

        if (request.getRideId() == null) {
            throw new ApiException("Ride is required", HttpStatus.BAD_REQUEST.value());
        }
        Ride ride = findRide(request.getRideId());

        if (ride.getDriverId().equals(passenger.getId())) {
            throw new ApiException("You can't book your own ride", HttpStatus.BAD_REQUEST.value());
        }
        if (ride.getStatus() != Ride.Status.ACTIVE) {
            throw new ApiException("This ride is no longer taking bookings", HttpStatus.CONFLICT.value());
        }
        if (bookingRepository.existsByRideIdAndPassengerIdAndStatusIn(ride.getId(), passenger.getId(), OPEN_BOOKINGS)) {
            throw new ApiException("You already have a booking on this ride", HttpStatus.CONFLICT.value());
        }

        int seats = request.getSeatsBooked() != null ? request.getSeatsBooked() : 1;
        if (seats < 1) {
            throw new ApiException("Book at least one seat", HttpStatus.BAD_REQUEST.value());
        }
        if (ride.getSeatsAvailable() < seats) {
            throw new ApiException("Not enough seats available", HttpStatus.BAD_REQUEST.value());
        }

        // Seats are held while the request is pending and released on reject/cancel
        ride.setSeatsAvailable(ride.getSeatsAvailable() - seats);
        if (ride.getSeatsAvailable() == 0) {
            ride.setStatus(Ride.Status.FULL);
        }
        rideRepository.save(ride);

        BigDecimal totalPrice = ride.getPrice().multiply(new BigDecimal(seats));

        Booking booking = Booking.builder()
                .rideId(ride.getId())
                .passengerId(passenger.getId())
                .seatsBooked(seats)
                .totalPrice(totalPrice)
                .status(Booking.Status.PENDING)
                .build();

        bookingRepository.save(booking);
        return toResponse(booking, ride, null, passenger);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(String email) {
        User passenger = findUser(email);
        List<Booking> bookings = bookingRepository.findByPassengerIdOrderByCreatedAtDesc(passenger.getId());
        if (bookings.isEmpty()) return List.of();

        Map<Long, Ride> rides = rideRepository.findAllById(bookings.stream().map(Booking::getRideId).distinct().toList())
                .stream().collect(Collectors.toMap(Ride::getId, Function.identity()));
        Map<Long, User> drivers = userRepository.findAllById(rides.values().stream().map(Ride::getDriverId).distinct().toList())
                .stream().collect(Collectors.toMap(User::getId, Function.identity()));

        return bookings.stream()
                .map(b -> {
                    Ride ride = rides.get(b.getRideId());
                    User driver = ride != null ? drivers.get(ride.getDriverId()) : null;
                    return BookingResponse.from(b, ride, driver, passenger);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public BookingResponse getBooking(String email, Long bookingId) {
        User viewer = findUser(email);
        Booking booking = findBooking(bookingId);
        Ride ride = findRide(booking.getRideId());
        requireParticipant(viewer, booking, ride);
        return toResponse(booking, ride, null, null);
    }

    /** Passenger withdraws a request or a confirmed seat before the trip starts. */
    @Transactional
    public BookingResponse cancelBooking(String email, Long bookingId) {
        User passenger = findUser(email);
        Booking booking = findBooking(bookingId);
        if (!booking.getPassengerId().equals(passenger.getId())) {
            throw new ApiException("This isn't your booking", HttpStatus.FORBIDDEN.value());
        }
        if (!OPEN_BOOKINGS.contains(booking.getStatus())) {
            throw new ApiException("This booking can no longer be cancelled", HttpStatus.CONFLICT.value());
        }
        Ride ride = findRide(booking.getRideId());
        if (ride.getStatus() == Ride.Status.IN_PROGRESS || ride.getStatus() == Ride.Status.COMPLETED) {
            throw new ApiException("The trip has already started", HttpStatus.CONFLICT.value());
        }

        booking.setStatus(Booking.Status.CANCELLED);
        bookingRepository.save(booking);
        releaseSeats(ride, booking);
        return toResponse(booking, ride, null, passenger);
    }

    @Transactional
    public BookingResponse acceptBooking(String email, Long bookingId) {
        User driver = findUser(email);
        Booking booking = findBooking(bookingId);
        Ride ride = requireDriverOf(driver, booking);
        if (booking.getStatus() != Booking.Status.PENDING) {
            throw new ApiException("Only pending requests can be accepted", HttpStatus.CONFLICT.value());
        }
        booking.setStatus(Booking.Status.CONFIRMED);
        bookingRepository.save(booking);
        return toResponse(booking, ride, driver, null);
    }

    @Transactional
    public BookingResponse rejectBooking(String email, Long bookingId) {
        User driver = findUser(email);
        Booking booking = findBooking(bookingId);
        Ride ride = requireDriverOf(driver, booking);
        if (booking.getStatus() != Booking.Status.PENDING) {
            throw new ApiException("Only pending requests can be rejected", HttpStatus.CONFLICT.value());
        }
        booking.setStatus(Booking.Status.REJECTED);
        bookingRepository.save(booking);
        releaseSeats(ride, booking);
        return toResponse(booking, ride, driver, null);
    }

    /* ---------- Helpers ---------- */

    private void releaseSeats(Ride ride, Booking booking) {
        ride.setSeatsAvailable(ride.getSeatsAvailable() + booking.getSeatsBooked());
        if (ride.getStatus() == Ride.Status.FULL) {
            ride.setStatus(Ride.Status.ACTIVE);
        }
        rideRepository.save(ride);
    }

    private BookingResponse toResponse(Booking booking, Ride ride, User driver, User passenger) {
        Map<Long, User> users = userRepository.findAllById(
                        Stream.of(ride.getDriverId(), booking.getPassengerId()).distinct().toList())
                .stream().collect(Collectors.toMap(User::getId, Function.identity()));
        return BookingResponse.from(booking, ride,
                driver != null ? driver : users.get(ride.getDriverId()),
                passenger != null ? passenger : users.get(booking.getPassengerId()));
    }

    private void requireParticipant(User viewer, Booking booking, Ride ride) {
        boolean allowed = booking.getPassengerId().equals(viewer.getId())
                || ride.getDriverId().equals(viewer.getId());
        if (!allowed) {
            throw new ApiException("Booking not found", HttpStatus.NOT_FOUND.value());
        }
    }

    private Ride requireDriverOf(User driver, Booking booking) {
        Ride ride = findRide(booking.getRideId());
        if (!ride.getDriverId().equals(driver.getId())) {
            throw new ApiException("This isn't your ride", HttpStatus.FORBIDDEN.value());
        }
        return ride;
    }

    private Booking findBooking(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ApiException("Booking not found", HttpStatus.NOT_FOUND.value()));
    }

    private Ride findRide(Long id) {
        return rideRepository.findById(id)
                .orElseThrow(() -> new ApiException("Ride not found", HttpStatus.NOT_FOUND.value()));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND.value()));
    }
}
