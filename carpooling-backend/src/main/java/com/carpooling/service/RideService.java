package com.carpooling.service;

import com.carpooling.dto.BookingResponse;
import com.carpooling.dto.CreateRideRequest;
import com.carpooling.dto.LocationUpdateRequest;
import com.carpooling.dto.RideResponse;
import com.carpooling.dto.TrackingResponse;
import com.carpooling.exception.ApiException;
import com.carpooling.model.Booking;
import com.carpooling.model.Ride;
import com.carpooling.model.Role;
import com.carpooling.model.User;
import com.carpooling.repository.BookingRepository;
import com.carpooling.repository.RideRepository;
import com.carpooling.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class RideService {
    private static final Set<Booking.Status> OPEN_BOOKINGS =
            EnumSet.of(Booking.Status.PENDING, Booking.Status.CONFIRMED);
    private static final Set<Booking.Status> TRACKABLE_BOOKINGS =
            EnumSet.of(Booking.Status.CONFIRMED, Booking.Status.COMPLETED);
    private static final int MAX_SEATS = 8;

    private final RideRepository rideRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    public RideService(RideRepository rideRepository, UserRepository userRepository,
                       BookingRepository bookingRepository) {
        this.rideRepository = rideRepository;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
    }

    /* ---------- Passenger-facing queries ---------- */

    @Transactional(readOnly = true)
    public List<RideResponse> searchRides(String origin, String destination) {
        List<Ride> rides = rideRepository.search(
                origin == null ? "" : origin.trim(),
                destination == null ? "" : destination.trim(),
                LocalDateTime.now().minusMinutes(30));
        return withDrivers(rides);
    }

    @Transactional(readOnly = true)
    public List<RideResponse> upcomingRides() {
        List<Ride> rides = rideRepository.findByStatusAndDepartureTimeAfterOrderByDepartureTimeAsc(
                Ride.Status.ACTIVE, LocalDateTime.now().minusMinutes(30));
        return withDrivers(rides.stream().limit(20).toList());
    }

    @Transactional(readOnly = true)
    public RideResponse getRide(Long rideId) {
        Ride ride = findRide(rideId);
        User driver = userRepository.findById(ride.getDriverId()).orElse(null);
        return RideResponse.from(ride, driver);
    }

    /* ---------- Driver: ride management ---------- */

    @Transactional
    public RideResponse createRide(String email, CreateRideRequest request) {
        User driver = findUser(email);
        if (driver.getRole() != Role.DRIVER) {
            throw new ApiException("Switch to driver mode before posting a ride", HttpStatus.FORBIDDEN.value());
        }
        if (driver.getVehiclePlate() == null || driver.getVehiclePlate().isBlank()) {
            throw new ApiException("Add your vehicle details before posting a ride", HttpStatus.FORBIDDEN.value());
        }
        validateNewRide(request);

        Ride ride = Ride.builder()
                .driverId(driver.getId())
                .origin(request.getOrigin().trim())
                .destination(request.getDestination().trim())
                .originLat(request.getOriginLat())
                .originLng(request.getOriginLng())
                .destinationLat(request.getDestinationLat())
                .destinationLng(request.getDestinationLng())
                .departureTime(request.getDepartureTime())
                .price(request.getPrice())
                .seatsAvailable(request.getSeatsAvailable())
                .note(request.getNote())
                .status(Ride.Status.ACTIVE)
                .build();

        rideRepository.save(ride);
        return RideResponse.from(ride, driver);
    }

    @Transactional(readOnly = true)
    public List<RideResponse> myRides(String email) {
        User driver = findUser(email);
        List<Ride> rides = rideRepository.findByDriverIdOrderByDepartureTimeDesc(driver.getId());
        if (rides.isEmpty()) return List.of();

        Map<Long, Long> pendingByRide = bookingRepository
                .findByRideIdInOrderByCreatedAtDesc(rides.stream().map(Ride::getId).toList())
                .stream()
                .filter(b -> b.getStatus() == Booking.Status.PENDING)
                .collect(Collectors.groupingBy(Booking::getRideId, Collectors.counting()));

        return rides.stream()
                .map(r -> RideResponse.from(r, driver)
                        .withPendingRequests(pendingByRide.getOrDefault(r.getId(), 0L).intValue()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> rideBookings(String email, Long rideId) {
        User driver = findUser(email);
        Ride ride = findOwnedRide(driver, rideId);
        List<Booking> bookings = bookingRepository.findByRideIdOrderByCreatedAtAsc(ride.getId());
        Map<Long, User> passengers = usersById(bookings.stream().map(Booking::getPassengerId).toList());
        return bookings.stream()
                .map(b -> BookingResponse.from(b, ride, driver, passengers.get(b.getPassengerId())))
                .toList();
    }

    @Transactional
    public RideResponse startRide(String email, Long rideId) {
        User driver = findUser(email);
        Ride ride = findOwnedRide(driver, rideId);
        if (ride.getStatus() != Ride.Status.ACTIVE && ride.getStatus() != Ride.Status.FULL) {
            throw new ApiException("Only upcoming rides can be started", HttpStatus.CONFLICT.value());
        }
        if (driverHasRideInProgress(driver.getId())) {
            throw new ApiException("Finish your current trip before starting another", HttpStatus.CONFLICT.value());
        }

        // Requests the driver never answered can't join a trip that's already moving
        List<Booking> pending = bookingRepository.findByRideIdAndStatusIn(
                ride.getId(), EnumSet.of(Booking.Status.PENDING));
        pending.forEach(b -> b.setStatus(Booking.Status.REJECTED));
        bookingRepository.saveAll(pending);

        ride.setStatus(Ride.Status.IN_PROGRESS);
        ride.setStartedAt(LocalDateTime.now());
        rideRepository.save(ride);
        return RideResponse.from(ride, driver);
    }

    @Transactional
    public void updateLocation(String email, Long rideId, LocationUpdateRequest request) {
        User driver = findUser(email);
        Ride ride = findOwnedRide(driver, rideId);
        if (ride.getStatus() != Ride.Status.IN_PROGRESS) {
            throw new ApiException("Start the trip before sharing your location", HttpStatus.CONFLICT.value());
        }
        ride.setCurrentLat(request.lat());
        ride.setCurrentLng(request.lng());
        ride.setLocationUpdatedAt(LocalDateTime.now());
        rideRepository.save(ride);
    }

    @Transactional
    public RideResponse completeRide(String email, Long rideId) {
        User driver = findUser(email);
        Ride ride = findOwnedRide(driver, rideId);
        if (ride.getStatus() != Ride.Status.IN_PROGRESS) {
            throw new ApiException("Only a trip in progress can be completed", HttpStatus.CONFLICT.value());
        }

        List<Booking> confirmed = bookingRepository.findByRideIdAndStatusIn(
                ride.getId(), EnumSet.of(Booking.Status.CONFIRMED));
        confirmed.forEach(b -> b.setStatus(Booking.Status.COMPLETED));
        bookingRepository.saveAll(confirmed);

        ride.setStatus(Ride.Status.COMPLETED);
        ride.setCompletedAt(LocalDateTime.now());
        rideRepository.save(ride);
        return RideResponse.from(ride, driver);
    }

    @Transactional
    public RideResponse cancelRide(String email, Long rideId) {
        User driver = findUser(email);
        Ride ride = findOwnedRide(driver, rideId);
        if (ride.getStatus() != Ride.Status.ACTIVE && ride.getStatus() != Ride.Status.FULL) {
            throw new ApiException("This ride can no longer be cancelled", HttpStatus.CONFLICT.value());
        }

        List<Booking> open = bookingRepository.findByRideIdAndStatusIn(ride.getId(), OPEN_BOOKINGS);
        open.forEach(b -> b.setStatus(Booking.Status.CANCELLED));
        bookingRepository.saveAll(open);

        ride.setStatus(Ride.Status.CANCELLED);
        rideRepository.save(ride);
        return RideResponse.from(ride, driver);
    }

    /* ---------- Live tracking ---------- */

    @Transactional(readOnly = true)
    public TrackingResponse tracking(String email, Long rideId) {
        User viewer = findUser(email);
        Ride ride = findRide(rideId);

        boolean isDriver = ride.getDriverId().equals(viewer.getId());
        boolean isPassenger = bookingRepository.existsByRideIdAndPassengerIdAndStatusIn(
                ride.getId(), viewer.getId(), TRACKABLE_BOOKINGS);
        if (!isDriver && !isPassenger) {
            throw new ApiException("Only the driver and confirmed passengers can track this ride",
                    HttpStatus.FORBIDDEN.value());
        }

        User driver = isDriver ? viewer : userRepository.findById(ride.getDriverId()).orElse(null);
        boolean live = ride.getStatus() == Ride.Status.IN_PROGRESS && ride.getLocationUpdatedAt() != null;
        Long secondsSince = live
                ? Duration.between(ride.getLocationUpdatedAt(), LocalDateTime.now()).getSeconds()
                : null;

        return new TrackingResponse(
                ride.getId(),
                ride.getStatus().name(),
                RideResponse.displayName(driver),
                ride.getOrigin(),
                ride.getDestination(),
                ride.getOriginLat(),
                ride.getOriginLng(),
                ride.getDestinationLat(),
                ride.getDestinationLng(),
                live ? ride.getCurrentLat() : null,
                live ? ride.getCurrentLng() : null,
                secondsSince
        );
    }

    /* ---------- Helpers ---------- */

    private void validateNewRide(CreateRideRequest r) {
        if (r.getOrigin() == null || r.getOrigin().isBlank()
                || r.getDestination() == null || r.getDestination().isBlank()) {
            throw badRequest("Pickup and destination are required");
        }
        if (r.getOrigin().trim().equalsIgnoreCase(r.getDestination().trim())) {
            throw badRequest("Pickup and destination must be different");
        }
        if (r.getDepartureTime() == null || r.getDepartureTime().isBefore(LocalDateTime.now().minusMinutes(5))) {
            throw badRequest("Departure time must be in the future");
        }
        if (r.getPrice() == null || r.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw badRequest("Price can't be negative");
        }
        if (r.getSeatsAvailable() == null || r.getSeatsAvailable() < 1 || r.getSeatsAvailable() > MAX_SEATS) {
            throw badRequest("Seats must be between 1 and " + MAX_SEATS);
        }
    }

    private boolean driverHasRideInProgress(Long driverId) {
        return !rideRepository.findByDriverIdAndStatusIn(driverId, EnumSet.of(Ride.Status.IN_PROGRESS)).isEmpty();
    }

    private List<RideResponse> withDrivers(List<Ride> rides) {
        Map<Long, User> drivers = usersById(rides.stream().map(Ride::getDriverId).toList());
        return rides.stream()
                .map(r -> RideResponse.from(r, drivers.get(r.getDriverId())))
                .collect(Collectors.toList());
    }

    private Map<Long, User> usersById(List<Long> ids) {
        return userRepository.findAllById(ids.stream().distinct().toList())
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
    }

    private Ride findRide(Long rideId) {
        return rideRepository.findById(rideId)
                .orElseThrow(() -> new ApiException("Ride not found", HttpStatus.NOT_FOUND.value()));
    }

    private Ride findOwnedRide(User driver, Long rideId) {
        Ride ride = findRide(rideId);
        if (!ride.getDriverId().equals(driver.getId())) {
            throw new ApiException("This isn't your ride", HttpStatus.FORBIDDEN.value());
        }
        return ride;
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND.value()));
    }

    private static ApiException badRequest(String message) {
        return new ApiException(message, HttpStatus.BAD_REQUEST.value());
    }
}
