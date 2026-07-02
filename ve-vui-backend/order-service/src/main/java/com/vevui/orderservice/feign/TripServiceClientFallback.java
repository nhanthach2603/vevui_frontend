package com.vevui.orderservice.feign;

import com.vevui.orderservice.dto.SeatLockDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
public class TripServiceClientFallback implements TripServiceClient {

    @Override
    public SeatLockDto.SeatLockResponse lockSeats(Long tripId, List<String> seats) {
        log.error("trip-service unavailable! Fallback for lockSeats tripId={}, seats={}", tripId, seats);
        return SeatLockDto.SeatLockResponse.builder()
                .success(false)
                .message("Dịch vụ chuyến đi tạm thời không khả dụng. Vui lòng thử lại sau.")
                .build();
    }
}
