package com.carpooling.service;

import com.carpooling.dto.ConversationResponse;
import com.carpooling.dto.MessageRequest;
import com.carpooling.dto.MessageResponse;
import com.carpooling.exception.ApiException;
import com.carpooling.model.Booking;
import com.carpooling.model.Message;
import com.carpooling.model.Ride;
import com.carpooling.model.User;
import com.carpooling.repository.BookingRepository;
import com.carpooling.repository.MessageRepository;
import com.carpooling.repository.RideRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.dto.RideResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/** Driver ↔ passenger chat. Each booking is one conversation thread. */
@Service
public class MessageService {
    // Rejected/cancelled requests drop out of the inbox and become read-only
    private static final Set<Booking.Status> CHAT_OPEN =
            EnumSet.of(Booking.Status.PENDING, Booking.Status.CONFIRMED, Booking.Status.COMPLETED);

    private final MessageRepository messageRepository;
    private final BookingRepository bookingRepository;
    private final RideRepository rideRepository;
    private final UserRepository userRepository;

    public MessageService(MessageRepository messageRepository, BookingRepository bookingRepository,
                          RideRepository rideRepository, UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.bookingRepository = bookingRepository;
        this.rideRepository = rideRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> list(String email, Long bookingId, Long afterId) {
        User viewer = findUser(email);
        Booking booking = findBooking(bookingId);
        Ride ride = findRide(booking.getRideId());
        requireParticipant(viewer, booking, ride);

        List<Message> messages = afterId != null
                ? messageRepository.findByBookingIdAndIdGreaterThanOrderByCreatedAtAsc(bookingId, afterId)
                : messageRepository.findByBookingIdOrderByCreatedAtAsc(bookingId);

        Map<Long, User> users = usersById(Stream.of(ride.getDriverId(), booking.getPassengerId()).toList());
        return messages.stream().map(m -> toResponse(m, viewer, users)).toList();
    }

    @Transactional
    public MessageResponse send(String email, Long bookingId, MessageRequest request) {
        User sender = findUser(email);
        Booking booking = findBooking(bookingId);
        Ride ride = findRide(booking.getRideId());
        requireParticipant(sender, booking, ride);
        if (!CHAT_OPEN.contains(booking.getStatus())) {
            throw new ApiException("This booking is closed, so the chat is read-only", HttpStatus.CONFLICT.value());
        }

        Message message = Message.builder()
                .bookingId(bookingId)
                .senderId(sender.getId())
                .message(request.message().trim())
                .build();
        messageRepository.save(message);
        return toResponse(message, sender, Map.of(sender.getId(), sender));
    }

    /** Inbox: every booking the user is part of, as passenger or as driver. */
    @Transactional(readOnly = true)
    public List<ConversationResponse> conversations(String email) {
        User viewer = findUser(email);

        List<Booking> asPassenger = bookingRepository.findByPassengerIdOrderByCreatedAtDesc(viewer.getId());
        List<Ride> myRides = rideRepository.findByDriverIdOrderByDepartureTimeDesc(viewer.getId());
        List<Booking> asDriver = myRides.isEmpty() ? List.of()
                : bookingRepository.findByRideIdInOrderByCreatedAtDesc(myRides.stream().map(Ride::getId).toList());

        List<Booking> all = new ArrayList<>(asPassenger);
        all.addAll(asDriver);
        all.removeIf(b -> !CHAT_OPEN.contains(b.getStatus()));
        if (all.isEmpty()) return List.of();

        Map<Long, Ride> rides = rideRepository.findAllById(all.stream().map(Booking::getRideId).distinct().toList())
                .stream().collect(Collectors.toMap(Ride::getId, Function.identity()));
        List<Long> userIds = new ArrayList<>(all.stream().map(Booking::getPassengerId).toList());
        rides.values().forEach(r -> userIds.add(r.getDriverId()));
        Map<Long, User> users = usersById(userIds);

        return all.stream()
                .map(b -> {
                    Ride ride = rides.get(b.getRideId());
                    boolean viewerDrives = ride.getDriverId().equals(viewer.getId());
                    User other = users.get(viewerDrives ? b.getPassengerId() : ride.getDriverId());
                    Optional<Message> last = messageRepository.findTopByBookingIdOrderByCreatedAtDesc(b.getId());
                    return new ConversationResponse(
                            b.getId(),
                            ride.getId(),
                            RideResponse.displayName(other),
                            viewerDrives ? "PASSENGER" : "DRIVER",
                            ride.getOrigin(),
                            ride.getDestination(),
                            ride.getDepartureTime(),
                            b.getStatus().name(),
                            last.map(Message::getMessage).orElse(null),
                            last.map(Message::getCreatedAt).orElse(null));
                })
                // Most recently active threads first, then by booking time
                .sorted(Comparator.comparing(
                        (ConversationResponse c) -> c.lastMessageAt() != null ? c.lastMessageAt() : LocalDateTime.MIN)
                        .reversed())
                .toList();
    }

    /* ---------- Helpers ---------- */

    private MessageResponse toResponse(Message m, User viewer, Map<Long, User> users) {
        return new MessageResponse(
                m.getId(),
                m.getBookingId(),
                m.getSenderId(),
                RideResponse.displayName(users.get(m.getSenderId())),
                m.getSenderId().equals(viewer.getId()),
                m.getMessage(),
                m.getCreatedAt());
    }

    private void requireParticipant(User viewer, Booking booking, Ride ride) {
        boolean allowed = booking.getPassengerId().equals(viewer.getId())
                || ride.getDriverId().equals(viewer.getId());
        if (!allowed) {
            throw new ApiException("Conversation not found", HttpStatus.NOT_FOUND.value());
        }
    }

    private Map<Long, User> usersById(List<Long> ids) {
        return userRepository.findAllById(ids.stream().distinct().toList())
                .stream().collect(Collectors.toMap(User::getId, Function.identity()));
    }

    private Booking findBooking(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ApiException("Conversation not found", HttpStatus.NOT_FOUND.value()));
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
