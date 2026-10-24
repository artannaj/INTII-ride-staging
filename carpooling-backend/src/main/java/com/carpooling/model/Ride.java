package com.carpooling.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "rides")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Ride {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "driver_id", nullable = false)
    private Long driverId;

    @Column(nullable = false, length = 150)
    private String origin;

    @Column(nullable = false, length = 150)
    private String destination;

    @Column(name = "departure_time", nullable = false)
    private LocalDateTime departureTime;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "seats_available", nullable = false)
    private Integer seatsAvailable;

    @Column(length = 255)
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status = Status.ACTIVE;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void pre() {
        createdAt = LocalDateTime.now();
        if (status == null) status = Status.ACTIVE;
    }

    public enum Status { ACTIVE, FULL, CANCELLED, COMPLETED }
}