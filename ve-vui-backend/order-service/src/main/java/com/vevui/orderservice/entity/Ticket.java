package com.vevui.orderservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {

    @Id
    @Column(length = 30)
    private String id; // e.g. VV20240622001

    @Column(nullable = false)
    private Long tripId;

    private Long customerId; // null for guest booking

    @Column(nullable = false, length = 100)
    private String customerName;

    @Column(nullable = false, length = 15)
    private String phone;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(nullable = false, length = 500)
    private String seats; // JSON array: ["A1","A2"]

    private Long pickupPointId;
    private Long dropoffPointId;

    @Column(nullable = false, precision = 12, scale = 0)
    private BigDecimal totalPrice;

    @Column(length = 50)
    private String paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.PENDING;

    // Denormalized trip info for easy display
    @Column(length = 100)
    private String fromCity;

    @Column(length = 100)
    private String toCity;

    private String tripDate;
    private String departureTime;
    private String arrivalTime;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime bookedAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum Status {
        PENDING, CONFIRMED, CANCELLED, REFUNDED
    }
}
