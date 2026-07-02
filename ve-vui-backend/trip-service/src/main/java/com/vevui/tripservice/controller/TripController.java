package com.vevui.tripservice.controller;

import com.vevui.tripservice.dto.TripDto;
import com.vevui.tripservice.service.TripService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    // ── Public: Routes ──

    @GetMapping("/api/routes")
    public ResponseEntity<List<TripDto.RouteDto>> getAllRoutes(
            @RequestParam(required = false, defaultValue = "false") boolean popularOnly) {
        return ResponseEntity.ok(popularOnly
                ? tripService.getPopularRoutes()
                : tripService.getAllRoutes());
    }

    @GetMapping("/api/routes/{id}")
    public ResponseEntity<TripDto.RouteDto> getRoute(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getRouteById(id));
    }

    // ── Public: Buses ──

    @GetMapping("/api/buses")
    public ResponseEntity<List<TripDto.BusDto>> getAllBuses() {
        return ResponseEntity.ok(tripService.getAllBuses());
    }

    // ── Public: Trip Search ──

    @GetMapping("/api/trips/search")
    public ResponseEntity<List<TripDto.TripResponse>> searchTrips(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam String date) {
        return ResponseEntity.ok(tripService.searchTrips(from, to, date));
    }

    @GetMapping("/api/trips/{id}")
    public ResponseEntity<TripDto.TripResponse> getTripById(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getTripById(id));
    }

    @GetMapping("/api/trips/{id}/seats")
    public ResponseEntity<TripDto.SeatMapResponse> getSeatMap(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getSeatMap(id));
    }

    // ── Public: Pickup Points ──

    @GetMapping("/api/pickup-points")
    public ResponseEntity<List<TripDto.PickupPointDto>> getPickupPoints(
            @RequestParam String city) {
        return ResponseEntity.ok(tripService.getPickupPoints(city));
    }

    // ── Internal: Seat Locking (called by order-service via Feign) ──

    @PostMapping("/api/trips/{id}/lock-seats")
    public ResponseEntity<TripDto.SeatLockResponse> lockSeats(
            @PathVariable Long id,
            @RequestBody List<String> seats) {
        return ResponseEntity.ok(tripService.lockSeats(id, seats));
    }

    // ── Admin: Route Management ──

    @PostMapping("/api/admin/routes")
    public ResponseEntity<TripDto.RouteDto> createRoute(
            @RequestBody TripDto.CreateRouteRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tripService.createRoute(req));
    }

    @PutMapping("/api/admin/routes/{id}")
    public ResponseEntity<TripDto.RouteDto> updateRoute(
            @PathVariable Long id,
            @RequestBody TripDto.CreateRouteRequest req) {
        return ResponseEntity.ok(tripService.updateRoute(id, req));
    }

    @DeleteMapping("/api/admin/routes/{id}")
    public ResponseEntity<Map<String, String>> deleteRoute(@PathVariable Long id) {
        tripService.deleteRoute(id);
        return ResponseEntity.ok(Map.of("message", "Tuyến đã được xóa"));
    }

    // ── Admin: Bus Management ──

    @PostMapping("/api/admin/buses")
    public ResponseEntity<TripDto.BusDto> createBus(
            @RequestBody TripDto.CreateBusRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tripService.createBus(req));
    }

    // ── Admin: Trip Management ──

    @PostMapping("/api/admin/trips")
    public ResponseEntity<TripDto.TripResponse> createTrip(
            @RequestBody TripDto.CreateTripRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tripService.createTrip(req));
    }

    @PutMapping("/api/admin/trips/{id}")
    public ResponseEntity<TripDto.TripResponse> updateTrip(
            @PathVariable Long id,
            @RequestBody TripDto.CreateTripRequest req) {
        return ResponseEntity.ok(tripService.updateTrip(id, req));
    }

    @PutMapping("/api/admin/buses/{id}")
    public ResponseEntity<TripDto.BusDto> updateBus(
            @PathVariable Long id,
            @RequestBody TripDto.CreateBusRequest req) {
        return ResponseEntity.ok(tripService.updateBus(id, req));
    }

    // ── Error Handler ──

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
