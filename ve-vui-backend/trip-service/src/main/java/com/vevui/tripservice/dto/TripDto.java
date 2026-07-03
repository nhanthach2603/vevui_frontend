package com.vevui.tripservice.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

public class TripDto {

    @Data
    public static class RouteDto {
        private Long id;
        private String fromCity;
        private String toCity;
        private Integer distanceKm;
        private Integer durationMinutes;
        private BigDecimal basePrice;
        private String stops;
        private String imageUrl;
        private Boolean popular;
    }

    @Data
    public static class CreateRouteRequest {
        private String fromCity;
        private String toCity;
        private Integer distanceKm;
        private Integer durationMinutes;
        private BigDecimal basePrice;
        private String stops;
        private String imageUrl;
        private Boolean popular;
    }

    @Data
    public static class BusDto {
        private Long id;
        private String plateNumber;
        private String name;
        private String status;
        private Long busTypeId;
        private String busTypeName;
        private String busTypeCode;
        private Integer totalSeats;
    }

    @Data
    public static class CreateBusRequest {
        private String plateNumber;
        private String name;
        private Long busTypeId;
    }

    @Data
    public static class BusTypeDto {
        private Long id;
        private String name;
        private String code;
        private Integer totalSeats;
        private String description;
        private String icon;
    }

    @Data
    public static class CreateBusTypeRequest {
        private String name;
        private String code;
        private Integer totalSeats;
        private String description;
        private String icon;
    }

    @Data
    public static class TripResponse {
        private Long id;
        private String tripDate;
        private String departureTime;
        private String arrivalTime;
        private BigDecimal price;
        private Integer availableSeats;
        private List<String> bookedSeats;
        private String status;
        private RouteDto route;
        private BusDto bus;
    }

    @Data
    public static class CreateTripRequest {
        private Long routeId;
        private Long busId;
        private String tripDate;
        private String departureTime;
        private String arrivalTime;
        private BigDecimal price;
    }

    @Data
    public static class PickupPointDto {
        private Long id;
        private String city;
        private String name;
        private String timeOffset;
        private String type;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeatLockRequest {
        private Long tripId;
        private List<String> seats;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeatLockResponse {
        private boolean success;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeatDto {
        private String id;
        private String label;
        private String status; // available, booked
        private int floor;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeatMapResponse {
        private Long tripId;
        private String busType;
        private int totalSeats;
        private int availableSeats;
        private List<List<SeatDto>> seatRows;
    }

    @Data
    public static class UpdateTripStatusRequest {
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TripStatsResponse {
        private long total;
        private long scheduled;
        private long departed;
        private long cancelled;
        private long completed;
    }

    @Data
    public static class UpdateBusStatusRequest {
        private String status;
    }
}
