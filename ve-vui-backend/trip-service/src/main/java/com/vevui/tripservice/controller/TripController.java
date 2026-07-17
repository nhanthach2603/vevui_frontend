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

/**
 * TripController — Điều phối HTTP request cho Trip Service
 *
 * Phân chia thành 4 nhóm endpoint chính:
 * 1. Public  : Dành cho frontend user (xem tuyến, tìm chuyến, xem ghế...)
 * 2. Internal: Gọi nội bộ giữa các microservice (Feign Client)
 * 3. Admin   : Quản lý tuyến, xe, loại xe, chuyến (phân trang + CRUD)
 * 4. Error   : Xử lý exception tập trung
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    // ════════════════════════════════════════════════════════
    // 1. PUBLIC ENDPOINTS — Dành cho frontend người dùng
    // ════════════════════════════════════════════════════════

    /**
     * Lấy danh sách tuyến xe
     * GET /api/routes?popularOnly=true
     *
     * popularOnly=false (mặc định): trả về TẤT CẢ tuyến đang hoạt động
     * popularOnly=true: chỉ trả về tuyến phổ biến (hiển thị trên trang chủ)
     *
     * Response: List<RouteDto> — JSON mảng các tuyến
     */
    @GetMapping("/api/routes")
    public ResponseEntity<List<TripDto.RouteDto>> getAllRoutes(
            @RequestParam(required = false, defaultValue = "false") boolean popularOnly) {
        return ResponseEntity.ok(popularOnly
                ? tripService.getPopularRoutes()
                : tripService.getAllRoutes());
    }

    /**
     * Lấy chi tiết 1 tuyến theo ID
     * GET /api/routes/1
     *
     * Dùng khi user bấm vào tuyến cụ thể trên trang chủ
     */
    @GetMapping("/api/routes/{id}")
    public ResponseEntity<TripDto.RouteDto> getRoute(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getRouteById(id));
    }

    /**
     * Lấy danh sách tất cả xe (công khai)
     * GET /api/buses
     *
     * Trả về danh sách xe + thông tin loại xe (tên, mã, số ghế)
     */
    @GetMapping("/api/buses")
    public ResponseEntity<List<TripDto.BusDto>> getAllBuses() {
        return ResponseEntity.ok(tripService.getAllBuses());
    }

    /**
     * Tìm chuyến đi theo tuyến + ngày
     * GET /api/trips/search?from=Hà Nội&to=Đà Nẵng&date=2024-07-09
     *
     * Đây là endpoint chính để user tra cứu chuyến
     * Kết quả được cache Redis 5 phút (tự động refresh khi có dữ liệu mới)
     *
     * Response: List<TripResponse> — danh sách chuyến kèm thông tin tuyến + xe
     */
    @GetMapping("/api/trips/search")
    public ResponseEntity<List<TripDto.TripResponse>> searchTrips(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam String date) {
        return ResponseEntity.ok(tripService.searchTrips(from, to, date));
    }

    /**
     * Lấy chi tiết 1 chuyến theo ID
     * GET /api/trips/1
     */
    @GetMapping("/api/trips/{id}")
    public ResponseEntity<TripDto.TripResponse> getTripById(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getTripById(id));
    }

    /**
     * Xem sơ đồ ghế của 1 chuyến
     * GET /api/trips/1/seats
     *
     * Trả về sơ đồ ghế theo loại xe:
     * - STANDARD/VIP: 4 ghế/hàng (A1,A2,A3,A4)
     * - SLEEPER: 2 tầng, 2 ghế/hàng
     * - LIMOUSINE: 2 ghế/hàng (rộng hơn)
     *
     * Response: SeatMapResponse — tổng số ghế, số còn trống, ma trận ghế
     */
    @GetMapping("/api/trips/{id}/seats")
    public ResponseEntity<TripDto.SeatMapResponse> getSeatMap(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getSeatMap(id));
    }

    /**
     * Lấy danh sách tất cả chuyến sắp khởi hành — cho trang Lịch trình
     * GET /api/trips/schedule
     *
     * Trả về các chuyến có trạng thái SCHEDULED hoặc DEPARTED,
     * sắp xếp theo ngày tăng dần, giờ khởi hành tăng dần
     */
    @GetMapping("/api/trips/schedule")
    public ResponseEntity<List<TripDto.TripResponse>> getScheduleTrips() {
        return ResponseEntity.ok(tripService.getScheduleTrips());
    }

    /**
     * Lấy danh sách điểm đón/trả theo thành phố
     * GET /api/pickup-points?city=Hà Nội
     *
     * Dùng khi user chọn điểm đón/trả khi đặt vé
     */
    @GetMapping("/api/pickup-points")
    public ResponseEntity<List<TripDto.PickupPointDto>> getPickupPoints(
            @RequestParam String city) {
        return ResponseEntity.ok(tripService.getPickupPoints(city));
    }

    // ════════════════════════════════════════════════════════
    // 2. INTERNAL ENDPOINTS — Gọi nội bộ qua Feign Client
    // ════════════════════════════════════════════════════════

    /**
     * Khóa ghế khi order-service xác nhận đặt vé
     * POST /api/trips/{id}/lock-seats
     *
     * Được gọi bởi order-service qua Feign Client (không qua API Gateway)
     * Xử lý atomic trong 1 transaction:
     * 1. Kiểm tra ghế có bị conflict không (đã có người đặt)
     * 2. Kiểm tra còn đủ chỗ trống
     * 3. Cập nhật bookedSeats + trừ availableSeats
     *
     * ⚠️ Race condition: dùng @Modifying query thay vì save() để tránh
     *    2 request cùng lúc đặt cùng 1 ghế
     */
    @PostMapping("/api/trips/{id}/lock-seats")
    public ResponseEntity<TripDto.SeatLockResponse> lockSeats(
            @PathVariable Long id,
            @RequestBody List<String> seats) {
        return ResponseEntity.ok(tripService.lockSeats(id, seats));
    }

    // ════════════════════════════════════════════════════════
    // 3. ADMIN ENDPOINTS — Quản lý dữ liệu (phân trang + CRUD)
    // ════════════════════════════════════════════════════════

    // ── Admin: Quản lý Tuyến đường ──

    /**
     * Admin: Lấy danh sách tuyến (có phân trang)
     * GET /api/admin/routes?page=0&size=20
     *
     * Phân trang server-side: page=0 là trang đầu, size=20 là 20 tuyến/trang
     * Trả về Page<RouteDto> chứa: content (dữ liệu), totalElements, totalPages...
     */
    @GetMapping("/api/admin/routes")
    public ResponseEntity<Page<TripDto.RouteDto>> getAllRoutesAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tripService.getAllRoutesAdmin(PageRequest.of(page, size)));
    }

    /**
     * Admin: Tạo tuyến mới
     * POST /api/admin/routes
     * Body: { "fromCity": "Hà Nội", "toCity": "Đà Nẵng", "basePrice": 350000, ... }
     *
     * Response trả về RouteDto vừa tạo (kèm id mới)
     * HTTP Status 201 (Created) khi thành công
     */
    @PostMapping("/api/admin/routes")
    public ResponseEntity<TripDto.RouteDto> createRoute(
            @RequestBody TripDto.CreateRouteRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tripService.createRoute(req));
    }

    /**
     * Admin: Cập nhật tuyến
     * PUT /api/admin/routes/1
     * Body: { "basePrice": 400000 }  ← chỉ cần gửi field muốn thay đổi
     *
     * Partial update: field nào null thì giữ nguyên, chỉ cập nhật field có giá trị
     */
    @PutMapping("/api/admin/routes/{id}")
    public ResponseEntity<TripDto.RouteDto> updateRoute(
            @PathVariable Long id,
            @RequestBody TripDto.CreateRouteRequest req) {
        return ResponseEntity.ok(tripService.updateRoute(id, req));
    }

    /**
     * Admin: Xóa tuyến (soft delete)
     * DELETE /api/admin/routes/1
     *
     * Không xóa DB mà chỉ set active=false → tuyến ẩn khỏi danh sách công khai
     * Giữ lại lịch sử các chuyến đã chạy trên tuyến này
     */
    @DeleteMapping("/api/admin/routes/{id}")
    public ResponseEntity<Map<String, String>> deleteRoute(@PathVariable Long id) {
        tripService.deleteRoute(id);
        return ResponseEntity.ok(Map.of("message", "Tuyến đã được xóa"));
    }

    // ── Admin: Quản lý Loại xe ──

    /**
     * Admin: Lấy tất cả loại xe
     * GET /api/admin/bus-types
     *
     * Trả về: STANDARD, VIP, SLEEPER, LIMOUSINE
     * Không phân trang vì số lượng loại xe ít (~4-6 loại)
     */
    @GetMapping("/api/admin/bus-types")
    public ResponseEntity<List<TripDto.BusTypeDto>> getAllBusTypes() {
        return ResponseEntity.ok(tripService.getAllBusTypes());
    }

    /**
     * Admin: Tạo loại xe mới
     * POST /api/admin/bus-types
     * Body: { "name": "Limousine 44 chỗ", "code": "LIMOUSINE", "totalSeats": 44 }
     */
    @PostMapping("/api/admin/bus-types")
    public ResponseEntity<TripDto.BusTypeDto> createBusType(
            @RequestBody TripDto.CreateBusTypeRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tripService.createBusType(req));
    }

    /**
     * Admin: Cập nhật loại xe (partial update)
     * PUT /api/admin/bus-types/1
     */
    @PutMapping("/api/admin/bus-types/{id}")
    public ResponseEntity<TripDto.BusTypeDto> updateBusType(
            @PathVariable Long id,
            @RequestBody TripDto.CreateBusTypeRequest req) {
        return ResponseEntity.ok(tripService.updateBusType(id, req));
    }

    /**
     * Admin: Xóa loại xe (hard delete — xóa vĩnh viễn)
     * DELETE /api/admin/bus-types/1
     *
     * ⚠️ Cẩn thận: chỉ xóa được khi chưa có xe nào thuộc loại này
     */
    @DeleteMapping("/api/admin/bus-types/{id}")
    public ResponseEntity<Map<String, String>> deleteBusType(@PathVariable Long id) {
        tripService.deleteBusType(id);
        return ResponseEntity.ok(Map.of("message", "Loại xe đã được xóa"));
    }

    // ── Admin: Quản lý Xe ──

    /**
     * Admin: Lấy danh sách xe (có phân trang)
     * GET /api/admin/buses?page=0&size=20
     */
    @GetMapping("/api/admin/buses")
    public ResponseEntity<Page<TripDto.BusDto>> getAllBusesAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tripService.getAllBusesAdmin(PageRequest.of(page, size)));
    }

    /**
     * Admin: Tìm kiếm xe theo từ khóa (biển số, tên xe)
     * GET /api/admin/buses/search?q=29A
     *
     * Tìm kiếm server-side: trả về kết quả phù hợp với từ khóa
     */
    @GetMapping("/api/admin/buses/search")
    public ResponseEntity<List<TripDto.BusDto>> searchBusesAdmin(
            @RequestParam String q) {
        return ResponseEntity.ok(tripService.searchBusesAdmin(q));
    }

    /**
     * Admin: Tạo xe mới
     * POST /api/admin/buses
     * Body: { "plateNumber": "29A-12345", "name": "XeLimousine01", "busTypeId": 4 }
     *
     * Xe mới mặc định status = ACTIVE
     * totalSeats lấy từ BusType (không truyền từ ngoài)
     */
    @PostMapping("/api/admin/buses")
    public ResponseEntity<TripDto.BusDto> createBus(
            @RequestBody TripDto.CreateBusRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tripService.createBus(req));
    }

    /**
     * Admin: Cập nhật thông tin xe (partial update)
     * PUT /api/admin/buses/1
     * Body: { "plateNumber": "29A-99999" }  ← chỉ thay đổi biển số
     */
    @PutMapping("/api/admin/buses/{id}")
    public ResponseEntity<TripDto.BusDto> updateBus(
            @PathVariable Long id,
            @RequestBody TripDto.CreateBusRequest req) {
        return ResponseEntity.ok(tripService.updateBus(id, req));
    }

    /**
     * Admin: Xóa xe (soft delete — set INACTIVE)
     * DELETE /api/admin/buses/1
     *
     * Không xóa DB, chỉ chuyển status → INACTIVE
     * Giữ lại lịch sử các chuyến xe này đã chạy
     */
    @DeleteMapping("/api/admin/buses/{id}")
    public ResponseEntity<Map<String, String>> deleteBus(@PathVariable Long id) {
        tripService.deleteBus(id);
        return ResponseEntity.ok(Map.of("message", "Xe đã được vô hiệu hóa"));
    }

    // ── Admin: Quản lý Chuyến đi ──

    /**
     * Admin: Lấy danh sách chuyến (có phân trang)
     * GET /api/admin/trips?page=0&size=20
     */
    @GetMapping("/api/admin/trips")
    public ResponseEntity<Page<TripDto.TripResponse>> getAllTripsAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tripService.getAllTripsAdmin(PageRequest.of(page, size)));
    }

    /**
     * Admin: Tìm kiếm chuyến theo từ khóa
     * GET /api/admin/trips/search?q=Hà Nội
     *
     * Tìm theo: fromCity, toCity, tripDate
     */
    @GetMapping("/api/admin/trips/search")
    public ResponseEntity<List<TripDto.TripResponse>> searchTripsAdmin(
            @RequestParam String q) {
        return ResponseEntity.ok(tripService.searchTripsAdmin(q));
    }

    /**
     * Admin: Tạo chuyến mới
     * POST /api/admin/trips
     * Body: {
     *   "routeId": 1, "busId": 5,
     *   "tripDate": "2024-07-09", "departureTime": "08:30", "arrivalTime": "14:30",
     *   "price": 350000
     * }
     *
     * availableSeats tự động = busType.totalSeats (số ghế ban đầu = tổng ghế của xe)
     */
    @PostMapping("/api/admin/trips")
    public ResponseEntity<TripDto.TripResponse> createTrip(
            @RequestBody TripDto.CreateTripRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tripService.createTrip(req));
    }

    @PostMapping("/api/admin/trips/batch")
    public ResponseEntity<TripDto.BatchCreateTripResponse> batchCreateTrips(
            @RequestBody TripDto.BatchCreateTripRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tripService.batchCreateTrips(req));
    }

    @GetMapping("/api/trips/available-dates")
    public ResponseEntity<List<TripDto.AvailableDateDto>> getAvailableDates(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) String month) {
        return ResponseEntity.ok(tripService.getAvailableDates(from, to, month));
    }

    /**
     * Admin: Lấy thống kê chuyến theo trạng thái
     * GET /api/admin/trips/stats
     *
     * Response: { "total": 150, "scheduled": 80, "departed": 30, "cancelled": 10, "completed": 30 }
     * Dùng để hiển thị trên Dashboard admin
     */
    @GetMapping("/api/admin/trips/stats")
    public ResponseEntity<TripDto.TripStatsResponse> getTripStats() {
        return ResponseEntity.ok(tripService.getTripStats());
    }

    /**
     * Admin: Lấy chi tiết 1 chuyến theo ID
     * GET /api/admin/trips/1
     */
    @GetMapping("/api/admin/trips/{id}")
    public ResponseEntity<TripDto.TripResponse> getTripByIdAdmin(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getTripById(id));
    }

    /**
     * Admin: Cập nhật chuyến (partial update)
     * PUT /api/admin/trips/1
     * Body: { "price": 400000 }  ← chỉ thay đổi giá
     */
    @PutMapping("/api/admin/trips/{id}")
    public ResponseEntity<TripDto.TripResponse> updateTrip(
            @PathVariable Long id,
            @RequestBody TripDto.CreateTripRequest req) {
        return ResponseEntity.ok(tripService.updateTrip(id, req));
    }

    /**
     * Admin: Thay đổi trạng thái chuyến
     * PUT /api/admin/trips/1/status
     * Body: { "status": "DEPARTED" }
     *
     * Các trạng thái: SCHEDULED → DEPARTED → COMPLETED
     *                  hoặc SCHEDULED → CANCELLED
     */
    @PutMapping("/api/admin/trips/{id}/status")
    public ResponseEntity<TripDto.TripResponse> updateTripStatus(
            @PathVariable Long id,
            @RequestBody TripDto.UpdateTripStatusRequest req) {
        return ResponseEntity.ok(tripService.updateTripStatus(id, req.getStatus()));
    }

    /**
     * Admin: Xóa chuyến (soft delete — set CANCELLED)
     * DELETE /api/admin/trips/1
     *
     * Không xóa DB, chuyển status → CANCELLED
     */
    @DeleteMapping("/api/admin/trips/{id}")
    public ResponseEntity<Map<String, String>> deleteTrip(@PathVariable Long id) {
        tripService.deleteTrip(id);
        return ResponseEntity.ok(Map.of("message", "Chuyến đi đã được hủy"));
    }

    // ── Admin: Chi tiết & Trạng thái Xe ──

    /**
     * Admin: Lấy chi tiết 1 xe theo ID
     * GET /api/admin/buses/1
     */
    @GetMapping("/api/admin/buses/{id}")
    public ResponseEntity<TripDto.BusDto> getBusByIdAdmin(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getBusById(id));
    }

    /**
     * Admin: Thay đổi trạng thái xe
     * PUT /api/admin/buses/1/status
     * Body: { "status": "MAINTENANCE" }
     *
     * Các trạng thái: ACTIVE, MAINTENANCE, INACTIVE
     */
    @PutMapping("/api/admin/buses/{id}/status")
    public ResponseEntity<TripDto.BusDto> updateBusStatus(
            @PathVariable Long id,
            @RequestBody TripDto.UpdateBusStatusRequest req) {
        return ResponseEntity.ok(tripService.updateBusStatus(id, req.getStatus()));
    }

    /**
     * Admin: Cập nhật thông tin vi phạm giao thông
     * PUT /api/admin/buses/{id}/violation
     */
    @PutMapping("/api/admin/buses/{id}/violation")
    public ResponseEntity<TripDto.BusDto> updateBusViolation(
            @PathVariable Long id,
            @RequestBody TripDto.UpdateBusViolationRequest req) {
        return ResponseEntity.ok(tripService.updateBusViolation(id, req));
    }

    /**
     * Admin: Lấy chi tiết 1 loại xe theo ID
     * GET /api/admin/bus-types/1
     */
    @GetMapping("/api/admin/bus-types/{id}")
    public ResponseEntity<TripDto.BusTypeDto> getBusTypeById(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getBusTypeById(id));
    }

    // ── Admin: Quản lý Điểm đón/trả ──

    @GetMapping("/api/admin/pickup-points")
    public ResponseEntity<List<TripDto.PickupPointDto>> getAllPickupPointsAdmin(
            @RequestParam(required = false) String city) {
        if (city != null && !city.isBlank()) {
            return ResponseEntity.ok(tripService.getPickupPointsByCityAdmin(city));
        }
        return ResponseEntity.ok(tripService.getAllPickupPointsAdmin());
    }

    @PostMapping("/api/admin/pickup-points")
    public ResponseEntity<TripDto.PickupPointDto> createPickupPoint(
            @RequestBody TripDto.CreatePickupPointRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tripService.createPickupPoint(req));
    }

    @PutMapping("/api/admin/pickup-points/{id}")
    public ResponseEntity<TripDto.PickupPointDto> updatePickupPoint(
            @PathVariable Long id,
            @RequestBody TripDto.UpdatePickupPointRequest req) {
        return ResponseEntity.ok(tripService.updatePickupPoint(id, req));
    }

    @DeleteMapping("/api/admin/pickup-points/{id}")
    public ResponseEntity<Map<String, String>> deletePickupPoint(@PathVariable Long id) {
        tripService.deletePickupPoint(id);
        return ResponseEntity.ok(Map.of("message", "Điểm đón/trả đã được xóa"));
    }

    // ── Admin: Trip ↔ Pickup Points ──

    @GetMapping("/api/admin/trips/{id}/pickup-points")
    public ResponseEntity<List<TripDto.TripPickupPointDto>> getTripPickupPoints(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getTripPickupPoints(id));
    }

    @PostMapping("/api/admin/trips/{id}/pickup-points")
    public ResponseEntity<List<TripDto.TripPickupPointDto>> saveTripPickupPoints(
            @PathVariable Long id,
            @RequestBody TripDto.SaveTripPickupPointsRequest req) {
        return ResponseEntity.ok(tripService.saveTripPickupPoints(id, req));
    }

    // ── Admin: Active Trips (not completed) ──

    @GetMapping("/api/admin/trips/active")
    public ResponseEntity<List<TripDto.TripResponse>> getActiveTrips() {
        return ResponseEntity.ok(tripService.getActiveTrips());
    }

    // ── Admin: Completed Trips ──

    @GetMapping("/api/admin/trips/completed")
    public ResponseEntity<List<TripDto.TripResponse>> getCompletedTrips(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String date) {
        if (q != null && !q.isBlank()) {
            return ResponseEntity.ok(tripService.searchCompletedTrips(q));
        }
        if (date != null && !date.isBlank()) {
            return ResponseEntity.ok(tripService.getCompletedTripsByDate(date));
        }
        return ResponseEntity.ok(tripService.getCompletedTrips());
    }

    @PutMapping("/api/admin/trips/{id}/confirm-completed")
    public ResponseEntity<TripDto.TripResponse> confirmTripCompleted(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.confirmTripCompleted(id));
    }

    // ── Public: Trip Pickup Points ──

    @GetMapping("/api/trips/{id}/pickup-points")
    public ResponseEntity<List<TripDto.TripPickupPointDto>> getTripPickupPointsPublic(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getTripPickupPoints(id));
    }

    // ── Cities ──

    @GetMapping("/api/cities")
    public ResponseEntity<List<TripDto.CityDto>> getAllCities() {
        return ResponseEntity.ok(tripService.getAllCities());
    }

    @GetMapping("/api/admin/cities")
    public ResponseEntity<List<TripDto.CityDto>> getAllCitiesAdmin() {
        return ResponseEntity.ok(tripService.getAllCitiesAdmin());
    }

    @PostMapping("/api/admin/cities")
    public ResponseEntity<TripDto.CityDto> createCity(
            @RequestBody TripDto.CreateCityRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tripService.createCity(req));
    }

    @PutMapping("/api/admin/cities/{id}")
    public ResponseEntity<TripDto.CityDto> updateCity(
            @PathVariable Long id,
            @RequestBody TripDto.CreateCityRequest req) {
        return ResponseEntity.ok(tripService.updateCity(id, req));
    }

    @DeleteMapping("/api/admin/cities/{id}")
    public ResponseEntity<Map<String, String>> deleteCity(@PathVariable Long id) {
        tripService.deleteCity(id);
        return ResponseEntity.ok(Map.of("message", "Thành phố đã được ẩn"));
    }

    @DeleteMapping("/api/admin/cities/{id}/permanent")
    public ResponseEntity<Map<String, String>> permanentDeleteCity(@PathVariable Long id) {
        tripService.permanentDeleteCity(id);
        return ResponseEntity.ok(Map.of("message", "Thành phố đã bị xóa vĩnh viễn"));
    }

    // ════════════════════════════════════════════════════════
    // 4. ERROR HANDLER — Xử lý lỗi tập trung
    // ════════════════════════════════════════════════════════

    /**
     * Bắt lỗi IllegalArgumentException → trả về 400 Bad Request
     *
     * Các lỗi thường gặp:
     * - "Không tìm thấy tuyến: 999" — ID không tồn tại
     * - "Không tìm thấy xe: 999"
     * - "Không tìm thấy chuyến: 999"
     *
     * Response: { "error": "Không tìm thấy tuyến: 999" }
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
