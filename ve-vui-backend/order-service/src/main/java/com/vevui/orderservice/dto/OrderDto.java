package com.vevui.orderservice.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

public class OrderDto {

    @Data
    public static class CreateTicketRequest {
        private Long tripId;
        private Long customerId;      // optional - null for guest
        private String customerName;
        private String phone;
        private String email;
        private List<String> seats;
        private Long pickupPointId;
        private Long dropoffPointId;
        private BigDecimal totalPrice;
        private String paymentMethod;
        private String couponCode;    // optional

        // Denormalized trip info from frontend
        private String fromCity;
        private String toCity;
        private String tripDate;
        private String departureTime;
        private String arrivalTime;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TicketResponse {
        private String id;
        private Long tripId;
        private Long customerId;
        private String customerName;
        private String phone;
        private String email;
        private List<String> seats;
        private Long pickupPointId;
        private Long dropoffPointId;
        private BigDecimal totalPrice;
        private String paymentMethod;
        private String status;
        private String fromCity;
        private String toCity;
        private String tripDate;
        private String departureTime;
        private String arrivalTime;
        private String bookedAt;
    }

    @Data
    public static class CouponRequest {
        private String code;
        private BigDecimal originalPrice;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CouponResponse {
        private boolean valid;
        private String code;
        private Double discountRate;
        private BigDecimal discountAmount;
        private BigDecimal finalPrice;
        private String message;
    }

    @Data
    public static class PaymentRequest {
        private String ticketId;
        private String paymentMethod;
        private BigDecimal amount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentResponse {
        private boolean success;
        private String transactionId;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatsResponse {
        private long totalTickets;
        private long confirmedTickets;
        private long cancelledTickets;
        private BigDecimal totalRevenue;
        private long todayTickets;
        private BigDecimal todayRevenue;
    }

    @Data
    public static class UpdateTicketStatusRequest {
        private String status;
    }
}
