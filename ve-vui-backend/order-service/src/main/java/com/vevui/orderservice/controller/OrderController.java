package com.vevui.orderservice.controller; // Package điều phối HTTP request

import com.vevui.orderservice.dto.OrderDto;
import com.vevui.orderservice.service.OrderService;
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
 * OrderController — Điều phối HTTP request cho Order Service
 *
 * Phân chia thành 4 nhóm endpoint chính:
 * 1. Public  : Đặt vé, xem vé theo SĐT, hủy vé (dành cho frontend user)
 * 2. Admin   : Quản lý vé (CRUD, tìm kiếm, xuất, thống kê)
 * 3. Payment : Thanh toán, áp dụng mã giảm giá
 * 4. Error   : Xử lý exception tập trung
 *
 * Tất cả response đều dùng ResponseEntity<T> để kiểm soát HTTP status code
 */
@Slf4j          // Tự sinh logger: log.info(), log.warn()...
@RestController // Đánh dấu đây là REST Controller — mỗi method trả về JSON
@RequiredArgsConstructor // Sinh constructor inject OrderService
public class OrderController {

    private final OrderService orderService;

    // ════════════════════════════════════════════════════════
    // 1. PUBLIC ENDPOINTS — Đặt vé & Tra cứu (dành cho user)
    // ════════════════════════════════════════════════════════

    /**
     * Đặt vé mới
     * POST /api/tickets
     * Body: CreateTicketRequest (tripId, customerName, phone, seats, totalPrice...)
     *
     * Luồng xử lý bên trong OrderService:
     * 1. Gọi trip-service qua Feign để khóa ghế (tránh race condition)
     * 2. Áp dụng mã giảm giá (nếu có)
     * 3. Tạo ID vé theo pattern "VV-yyyyMMddHHmm-XXXX"
     * 4. Lưu vé vào DB (status = CONFIRMED)
     * 5. Gửi sự kiện Kafka "booking-confirmed"
     *
     * HTTP Status 201 (Created) khi thành công
     * Throw IllegalStateException nếu ghế bị chiếm
     */
    @PostMapping("/api/tickets")
    public ResponseEntity<OrderDto.TicketResponse> createTicket(
            @RequestBody OrderDto.CreateTicketRequest request) {
        log.info("POST /api/tickets for trip={}", request.getTripId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.createTicket(request));
    }

    /**
     * Lấy chi tiết 1 vé theo ID
     * GET /api/tickets/VV20240622001-ABCD
     *
     * Dùng khi user muốn xem chi tiết vé đã đặt
     */
    @GetMapping("/api/tickets/{id}")
    public ResponseEntity<OrderDto.TicketResponse> getTicketById(@PathVariable String id) {
        return ResponseEntity.ok(orderService.getTicketById(id));
    }

    /**
     * Tra cứu vé theo SĐT hoặc customerId
     * GET /api/tickets/search?phone=0912345678
     * GET /api/tickets/search?customerId=1
     *
     * Public endpoint — không cần đăng nhập
     * Dùng cho trang "Tra cứu vé" trên frontend user
     *
     * Nếu cả phone và customerId đều null → trả về 400 Bad Request
     */
    @GetMapping("/api/tickets/search")
    public ResponseEntity<List<OrderDto.TicketResponse>> searchTickets(
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) Long customerId) {
        if (phone != null) {
            return ResponseEntity.ok(orderService.searchByPhone(phone));
        } else if (customerId != null) {
            return ResponseEntity.ok(orderService.getMyTickets(customerId));
        }
        return ResponseEntity.badRequest().build(); // 400: thiếu tham số
    }

    /**
     * Hủy vé
     * PUT /api/tickets/VV20240622001-ABCD/cancel
     *
     * Đặt status = CANCELLED (soft delete)
     * ⚠️ Chưa hoàn tiền tự động — cần tích hợp payment gateway
     * ⚠️ Chưa mở lại ghế trong trip-service — cần gọi Feign để unlock
     */
    @PutMapping("/api/tickets/{id}/cancel")
    public ResponseEntity<OrderDto.TicketResponse> cancelTicket(@PathVariable String id) {
        return ResponseEntity.ok(orderService.cancelTicket(id));
    }

    // ════════════════════════════════════════════════════════
    // 2. ADMIN ENDPOINTS — Quản lý vé (phân trang + CRUD)
    // ════════════════════════════════════════════════════════

    /**
     * Admin: Lấy tất cả vé (có phân trang)
     * GET /api/admin/tickets?page=0&size=20
     *
     * Phân trang server-side: page=0 là trang đầu, size=20 là 20 vé/trang
     * Sắp xếp theo bookedAt giảm dần (vé mới nhất lên đầu)
     */
    @GetMapping("/api/admin/tickets")
    public ResponseEntity<Page<OrderDto.TicketResponse>> getAllTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(orderService.getAllTickets(PageRequest.of(page, size)));
    }

    /**
     * Admin: Lấy thống kê vé
     * GET /api/admin/stats
     *
     * Response: StatsResponse
     * - totalTickets     : tổng số vé
     * - confirmedTickets : vé đã xác nhận
     * - cancelledTickets : vé đã hủy
     * - totalRevenue     : tổng doanh thu
     * - todayTickets     : vé hôm nay
     * - todayRevenue     : doanh thu hôm nay
     */
    @GetMapping("/api/admin/stats")
    public ResponseEntity<OrderDto.StatsResponse> getStats() {
        return ResponseEntity.ok(orderService.getStats());
    }

    /**
     * Admin: Tìm kiếm vé theo từ khóa
     * GET /api/admin/tickets/search?q=Nguyễn
     *
     * Tìm theo: tên khách hàng, SĐT, mã vé
     * Endpoint này phải ĐẶT TRƯỚC /{id} để Spring không nhầm là id
     */
    @GetMapping("/api/admin/tickets/search")
    public ResponseEntity<List<OrderDto.TicketResponse>> searchTicketsAdmin(
            @RequestParam String q) {
        return ResponseEntity.ok(orderService.searchTicketsAdmin(q));
    }

    @GetMapping("/api/admin/tickets/trip/{tripId}")
    public ResponseEntity<List<OrderDto.TicketResponse>> getTicketsByTripId(
            @PathVariable Long tripId) {
        return ResponseEntity.ok(orderService.getTicketsByTripId(tripId));
    }

    /**
     * Admin: Xuất danh sách vé (tất cả, không phân trang)
     * GET /api/admin/tickets/export
     *
     * Dùng để export CSV/Excel trên frontend admin
     */
    @GetMapping("/api/admin/tickets/export")
    public ResponseEntity<List<OrderDto.TicketResponse>> exportTickets() {
        return ResponseEntity.ok(orderService.exportTickets());
    }

    /**
     * Admin: Tạo vé mới (bypass khóa ghế)
     * POST /api/admin/tickets
     *
     * skipLock=true → không gọi Feign lockSeats
     * Dùng khi admin tạo vé trực tiếp (khách gọi điện đặt)
     */
    @PostMapping("/api/admin/tickets")
    public ResponseEntity<OrderDto.TicketResponse> createTicketAdmin(
            @RequestBody OrderDto.CreateTicketRequest request) {
        log.info("POST /api/admin/tickets for trip={}", request.getTripId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.createTicket(request));
    }

    /**
     * Admin: Lấy chi tiết 1 vé theo ID
     * GET /api/admin/tickets/VV20240622001-ABCD
     */
    @GetMapping("/api/admin/tickets/{id}")
    public ResponseEntity<OrderDto.TicketResponse> getTicketByIdAdmin(@PathVariable String id) {
        return ResponseEntity.ok(orderService.getTicketById(id));
    }

    /**
     * Admin: Thay đổi trạng thái vé
     * PUT /api/admin/tickets/VV20240622001-ABCD/status
     * Body: { "status": "REFUNDED" }
     *
     * Các trạng thái: PENDING, CONFIRMED, CANCELLED, REFUNDED, USED
     */
    @PutMapping("/api/admin/tickets/{id}/status")
    public ResponseEntity<OrderDto.TicketResponse> updateTicketStatus(
            @PathVariable String id,
            @RequestBody OrderDto.UpdateTicketStatusRequest req) {
        return ResponseEntity.ok(orderService.updateTicketStatus(id, req.getStatus()));
    }

    /**
     * Admin: Xóa vé (hard delete — xóa vĩnh viễn khỏi DB)
     * DELETE /api/admin/tickets/VV20240622001-ABCD
     *
     * ⚠️ Cẩn thận: không thể khôi phục sau khi xóa
     */
    @DeleteMapping("/api/admin/tickets/{id}")
    public ResponseEntity<Map<String, String>> deleteTicket(@PathVariable String id) {
        orderService.deleteTicket(id);
        return ResponseEntity.ok(Map.of("message", "Vé đã được xóa"));
    }

    // ════════════════════════════════════════════════════════
    // 3. PAYMENT ENDPOINTS — Thanh toán & Mã giảm giá
    // ════════════════════════════════════════════════════════

    /**
     * Xử lý thanh toán
     * POST /api/payment/process
     * Body: { "ticketId": "VV...", "paymentMethod": "MOMO", "amount": 350000 }
     *
     * ⚠️ Hiện tại là MOCK — luôn trả về success=true
     * TODO: Tích hợpจรับ với MoMo, VNPay, ZaloPay API
     */
    @PostMapping("/api/payment/process")
    public ResponseEntity<OrderDto.PaymentResponse> processPayment(
            @RequestBody OrderDto.PaymentRequest request) {
        return ResponseEntity.ok(orderService.processPayment(request));
    }

    /**
     * Áp dụng mã giảm giá
     * POST /api/payment/apply-coupon
     * Body: { "code": "SUMMER10", "originalPrice": 350000 }
     *
     * Response: CouponResponse
     * - valid         : mã có hợp lệ không
     * - discountRate  : tỷ lệ giảm (0.10 = 10%)
     * - discountAmount: số tiền giảm
     * - finalPrice    : giá sau khi giảm
     */
    @PostMapping("/api/payment/apply-coupon")
    public ResponseEntity<OrderDto.CouponResponse> applyCoupon(
            @RequestBody OrderDto.CouponRequest request) {
        return ResponseEntity.ok(orderService.applyCoupon(request));
    }

    // ════════════════════════════════════════════════════════
    // 4. ERROR HANDLER — Xử lý lỗi tập trung
    // ════════════════════════════════════════════════════════

    /**
     * Bắt 2 loại exception phổ biến → trả về 400 Bad Request
     *
     * IllegalArgumentException: "Không tìm thấy vé: VV..."
     * IllegalStateException: "Vé đã bị hủy trước đó", "Không thể đặt ghế: Ghế đã được đặt"
     *
     * Response: { "error": "Không tìm thấy vé: VV..." }
     */
    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<Map<String, String>> handleErrors(RuntimeException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
