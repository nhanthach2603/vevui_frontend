package com.vevui.orderservice.feign; // Package chứa Feign Client gọi service khác

import com.vevui.orderservice.dto.SeatLockDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  TripServiceClient — Feign Client gọi trip-service
 *
 *  Feign Client: interface giả lập HTTP client
 *  → Spring tự sinh implementation tại runtime
 *  → Gọi trip-service qua HTTP nhưng code như gọi method Java
 *
 *  Khi nào cần dùng?
 *  → Order Service muốn khóa ghế trong trip-service khi khách đặt vé
 *  → thay vì viết RestTemplate thủ công, dùng @FeignClient
 *
 *  @FeignClient(name = "trip-service"):
 *  → Tìm service tên "trip-service" qua Eureka Service Discovery
 *  → Tự load-balancing nếu trip-service chạy nhiều instance
 *
 *  fallback = TripServiceClientFallback.class:
 *  → Nếu trip-service chết/không phản hồi → gọi fallback method
 *  → Tránh crash toàn bộ Order Service chỉ vì trip-service lỗi
 * ╚══════════════════════════════════════════════════════════╝
 */
@FeignClient(name = "trip-service", fallback = TripServiceClientFallback.class)
public interface TripServiceClient {

    /**
     * Khóa ghế trong trip-service
     * POST /api/trips/{tripId}/lock-seats
     *
     * @param tripId : ID chuyến đi (path variable)
     * @param seats  : danh sách ghế cần khóa (request body JSON)
     * @return SeatLockResponse: { success: true/false, message: "..." }
     *
     * Trip Service xử lý:
     * 1. Kiểm tra ghế có bị conflict không
     * 2. Kiểm tra còn đủ chỗ trống
     * 3. Cập nhật bookedSeats + trừ availableSeats (atomic)
     *
     * Nếu trip-service chết → Fallback trả về success=false
     */
    @PostMapping("/api/trips/{tripId}/lock-seats")
    SeatLockDto.SeatLockResponse lockSeats(
            @PathVariable("tripId") Long tripId,
            @RequestBody List<String> seats);
}
