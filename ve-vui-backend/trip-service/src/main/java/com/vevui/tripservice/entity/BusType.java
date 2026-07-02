package com.vevui.tripservice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "bus_types")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(unique = true, nullable = false, length = 20)
    private String code; // STANDARD, VIP, SLEEPER, LIMOUSINE

    @Column(nullable = false)
    private Integer totalSeats;

    @Column(length = 255)
    private String description;

    @Column(length = 10)
    @Builder.Default
    private String icon = "🚌";
}
