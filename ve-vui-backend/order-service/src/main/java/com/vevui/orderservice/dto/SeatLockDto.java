package com.vevui.orderservice.dto; // Package chứa Data Transfer Object

import lombok.*;

/**
 * SeatLockDto — DTO cho phản hồi từ trip-service khi khóa ghế
 *
 * Được dùng bởi Feign Client (TripServiceClient) khi gọi POST /api/trips/{id}/lock-seats
 *
 * TripService trả về SeatLockResponse:
 * - success: true/false
 * - message: "Khóa ghế thành công" hoặc "Ghế đã được đặt: A1, A2"
 */
public class SeatLockDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeatLockResponse {
        private boolean success;    // Khóa ghế thành công?
        private String message;     // Thông báo chi tiết
    }
}
