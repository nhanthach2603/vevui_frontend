package com.vevui.tripservice.controller;

import com.vevui.tripservice.dto.TripDto;
import com.vevui.tripservice.service.TripService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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

    @GetMapping("/api/admin/routes")
    public ResponseEntity<Page<TripDto.RouteDto>> getAllRoutesAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tripService.getAllRoutesAdmin(PageRequest.of(page, size)));
    }

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

    @GetMapping("/api/admin/bus-types")
    public ResponseEntity<List<TripDto.BusTypeDto>> getAllBusTypes() {
        return ResponseEntity.ok(tripService.getAllBusTypes());
    }

    @PostMapping("/api/admin/bus-types")
    public ResponseEntity<TripDto.BusTypeDto> createBusType(
            @RequestBody TripDto.CreateBusTypeRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tripService.createBusType(req));
    }

    @PutMapping("/api/admin/bus-types/{id}")
    public ResponseEntity<TripDto.BusTypeDto> updateBusType(
            @PathVariable Long id,
            @RequestBody TripDto.CreateBusTypeRequest req) {
        return ResponseEntity.ok(tripService.updateBusType(id, req));
    }

    @DeleteMapping("/api/admin/bus-types/{id}")
    public ResponseEntity<Map<String, String>> deleteBusType(@PathVariable Long id) {
        tripService.deleteBusType(id);
        return ResponseEntity.ok(Map.of("message", "Loại xe đã được xóa"));
    }

    @GetMapping("/api/admin/buses")
    public ResponseEntity<Page<TripDto.BusDto>> getAllBusesAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tripService.getAllBusesAdmin(PageRequest.of(page, size)));
    }

    @PostMapping("/api/admin/buses")
    public ResponseEntity<TripDto.BusDto> createBus(
            @RequestBody TripDto.CreateBusRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tripService.createBus(req));
    }

    @DeleteMapping("/api/admin/buses/{id}")
    public ResponseEntity<Map<String, String>> deleteBus(@PathVariable Long id) {
        tripService.deleteBus(id);
        return ResponseEntity.ok(Map.of("message", "Xe đã được vô hiệu hóa"));
    }

    // ── Admin: Trip Management ──

    @GetMapping("/api/admin/trips")
    public ResponseEntity<Page<TripDto.TripResponse>> getAllTripsAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tripService.getAllTripsAdmin(PageRequest.of(page, size)));
    }

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

    @DeleteMapping("/api/admin/trips/{id}")
    public ResponseEntity<Map<String, String>> deleteTrip(@PathVariable Long id) {
        tripService.deleteTrip(id);
        return ResponseEntity.ok(Map.of("message", "Chuyến đi đã được hủy"));
    }

    // ── Admin: Trip Detail & Status ──

    @GetMapping("/api/admin/trips/{id}")
    public ResponseEntity<TripDto.TripResponse> getTripByIdAdmin(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getTripById(id));
    }

    @PutMapping("/api/admin/trips/{id}/status")
    public ResponseEntity<TripDto.TripResponse> updateTripStatus(
            @PathVariable Long id,
            @RequestBody TripDto.UpdateTripStatusRequest req) {
        return ResponseEntity.ok(tripService.updateTripStatus(id, req.getStatus()));
    }

    @GetMapping("/api/admin/trips/stats")
    public ResponseEntity<TripDto.TripStatsResponse> getTripStats() {
        return ResponseEntity.ok(tripService.getTripStats());
    }

    // ── Admin: Bus Detail & Status ──

    @GetMapping("/api/admin/buses/{id}")
    public ResponseEntity<TripDto.BusDto> getBusByIdAdmin(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getBusById(id));
    }

    @PutMapping("/api/admin/buses/{id}/status")
    public ResponseEntity<TripDto.BusDto> updateBusStatus(
            @PathVariable Long id,
            @RequestBody TripDto.UpdateBusStatusRequest req) {
        return ResponseEntity.ok(tripService.updateBusStatus(id, req.getStatus()));
    }

    // ── Error Handler ──

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
