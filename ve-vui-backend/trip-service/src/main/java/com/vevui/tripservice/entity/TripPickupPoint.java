package com.vevui.tripservice.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "trip_pickup_points", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"trip_id", "pickup_point_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripPickupPoint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pickup_point_id", nullable = false)
    private PickupPoint pickupPoint;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length =20)
    @Builder.Default
    private PointRole role = PointRole.PICKUP;

    public enum PointRole {
        PICKUP, DROPOFF
    }
}