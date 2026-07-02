package com.vevui.orderservice.feign;

import com.vevui.orderservice.dto.SeatLockDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@FeignClient(name = "trip-service", fallback = TripServiceClientFallback.class)
public interface TripServiceClient {

    @PostMapping("/api/trips/{tripId}/lock-seats")
    SeatLockDto.SeatLockResponse lockSeats(
            @PathVariable("tripId") Long tripId,
            @RequestBody List<String> seats);
}
