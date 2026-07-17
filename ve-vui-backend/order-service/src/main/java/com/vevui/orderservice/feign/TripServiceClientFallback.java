package com.vevui.orderservice.feign; // Package chứa Feign Client

import com.vevui.orderservice.dto.SeatLockDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  TripServiceClientFallback — Xử lý khi trip-service không khả dụng
 *
 *  Fallback Pattern (Circuit Breaker):
 *  → Khi trip-service chết, timeout, hoặc lỗi mạng
 *  → Spring自动 gọi method fallback thay vì throw exception
 *  → Tránh cascading failure (lỗi trip-service lan sang Order Service)
 *
 *  Fallback trả về success=false → Order Service xử lý và thông báo cho client
 * ╚══════════════════════════════════════════════════════════╝
 */
@Slf4j          // Logger: log.error() khi fallback được gọi
@Component      // Đăng ký Spring Bean — Spring tìm thấy khi scan
public class TripServiceClientFallback implements TripServiceClient {

    /**
     * Fallback cho lockSeats()
     * Gọi khi trip-service không phản hồi hoặc抛出异常
     *
     * Log.error(): ghi log để admin biết trip-service đang bị down
     * Trả về success=false → OrderService sẽ throw IllegalStateException
     * → Client nhận lỗi 400 Bad Request
     */
    @Override
    public SeatLockDto.SeatLockResponse lockSeats(Long tripId, List<String> seats) {
        log.error("trip-service unavailable! Fallback for lockSeats tripId={}, seats={}", tripId, seats);
        return SeatLockDto.SeatLockResponse.builder()
                .success(false)
                .message("Dịch vụ chuyến đi tạm thời không khả dụng. Vui lòng thử lại sau.")
                .build();
    }
}
