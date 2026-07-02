package com.vevui.orderservice.dto;

import lombok.*;

public class SeatLockDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeatLockResponse {
        private boolean success;
        private String message;
    }
}
