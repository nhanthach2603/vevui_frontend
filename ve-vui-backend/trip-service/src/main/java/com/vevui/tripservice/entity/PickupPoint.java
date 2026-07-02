package com.vevui.tripservice.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "pickup_points")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PickupPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 50)
    private String timeOffset; // e.g. "-30 phút", "0 phút", "+10 phút"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PointType type; // PICKUP or DROPOFF

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    public enum PointType {
        PICKUP, DROPOFF, BOTH
    }
}
