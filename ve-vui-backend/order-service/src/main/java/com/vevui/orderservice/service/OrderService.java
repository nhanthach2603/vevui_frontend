package com.vevui.orderservice.service; // Package chứa tầng xử lý business logic

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vevui.orderservice.dto.OrderDto;
import com.vevui.orderservice.dto.SeatLockDto;
import com.vevui.orderservice.entity.Coupon;
import com.vevui.orderservice.entity.Ticket;
import com.vevui.orderservice.feign.TripServiceClient;
import com.vevui.orderservice.kafka.BookingEventProducer;
import com.vevui.orderservice.repository.CouponRepository;
import com.vevui.orderservice.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  OrderService — Tầng xử lý nghiệp vụ chính của Order Service
 *
 *  Quản lý 4 nhóm chức năng:
 *  1. TICKET  : Đặt vé, xem vé, hủy vé, quản lý vé (admin)
 *  2. COUPON  : Áp dụng mã giảm giá
 *  3. PAYMENT : Xử lý thanh toán (mock)
 *  4. STATS   : Thống kê vé cho admin dashboard
 *
 *  Giao tiếp với service khác:
 *  - TripServiceClient (Feign) → gọi trip-service để khóa ghế
 *  - BookingEventProducer (Kafka) → gửi sự kiện "booking-confirmed"
 *
 *  Luồng đặt vé chính:
 *  1. Khóa ghế qua Feign → trip-service
 *  2. Áp dụng mã giảm giá (nếu có)
 *  3. Tạo ticket ID (pattern: VV + yyyyMMddHHmm + 4 random chars)
 *  4. Lưu Ticket vào DB
 *  5. Gửi Kafka event (async notification)
 * ╚══════════════════════════════════════════════════════════╝
 */
@Slf4j            // Tự sinh logger: log.info(), log.warn(), log.error()
@Service          // Đăng ký là Spring Bean kiểu Service
@RequiredArgsConstructor // Sinh constructor inject tất cả field final
public class OrderService {

    // ── Inject Dependencies qua constructor ──
    private final TicketRepository ticketRepository;       // Truy cập bảng tickets
    private final CouponRepository couponRepository;       // Truy cập bảng coupons
    private final TripServiceClient tripServiceClient;     // Feign Client gọi trip-service
    private final BookingEventProducer bookingEventProducer; // Kafka Producer gửi sự kiện
    private final ObjectMapper objectMapper;               // Parse/serialize JSON

    // ════════════════════════════════════════════════════════
    // 1. TICKET OPERATIONS — Đặt vé & Quản lý vé
    // ════════════════════════════════════════════════════════

    /**
     * Đặt vé mới — METHOD QUAN TRỌNG NHẤT của Order Service
     *
     * @param req : thông tin đặt vé từ frontend
     * @return TicketResponse : vé vừa tạo
     *
     * Luồng xử lý (5 bước):
     *
     * BƯỚC 1 — Khóa ghế qua Feign:
     *   Gọi POST /api/trips/{tripId}/lock-seats
     *   → trip-service kiểm tra conflict + trừ availableSeats
     *   → Nếu ghế bị chiếm → throw exception, không tạo vé
     *   → skipLock=true: admin bypass (tạo vé trực tiếp không cần khóa)
     *
     * BƯỚC 2 — Áp dụng mã giảm giá:
     *   Nếu có couponCode → gọi applyCoupon()
     *   → Tính finalPrice = originalPrice - discount
     *
     * BƯỚC 3 — Tạo ticket ID:
     *   Pattern: "VV" + yyyyMMddHHmm + "-" + 4 random chars
     *   VD: VV202406220015-ABCD
     *
     * BƯỚC 4 — Lưu Ticket vào DB:
     *   status = CONFIRMED (khác với PENDING mặc định — vì đã khóa ghế thành công)
     *
     * BƯỚC 5 — Gửi Kafka event:
     *   Gửi "booking-confirmed" đến Kafka topic
     *   → Notification Service lắng nghe → gửi email/SMS cho khách
     */
    @Transactional // Toàn bộ 5 bước trong 1 transaction — nếu lỗi giữa chừng → rollback
    public OrderDto.TicketResponse createTicket(OrderDto.CreateTicketRequest req) {
        log.info("Creating ticket for trip {} seats {}", req.getTripId(), req.getSeats());

        // ── BƯỚC 1: Khóa ghế qua Feign Client ──
        boolean skipLock = Boolean.TRUE.equals(req.getSkipLock());
        if (!skipLock) {
            // Gọi trip-service qua HTTP (Feign tự convert Java method → HTTP POST)
            SeatLockDto.SeatLockResponse lockResult = tripServiceClient.lockSeats(
                req.getTripId(), req.getSeats());

            if (!lockResult.isSuccess()) {
                // Ghế bị chiếm hoặc không đủ chỗ → throw → rollback transaction
                throw new IllegalStateException("Không thể đặt ghế: " + lockResult.getMessage());
            }
        } else {
            // Admin tạo vé trực tiếp → bỏ qua bước khóa ghế
            log.info("Admin skipLock=true — bypassing seat lock for trip {}", req.getTripId());
        }

        // ── BƯỚC 2: Áp dụng mã giảm giá (nếu có) ──
        BigDecimal finalPrice = req.getTotalPrice();
        if (req.getCouponCode() != null && !req.getCouponCode().isBlank()) {
            // Tạo CouponRequest từ CreateTicketRequest
            OrderDto.CouponResponse couponResp = applyCoupon(
                new OrderDto.CouponRequest() {{
                    setCode(req.getCouponCode());
                    setOriginalPrice(req.getTotalPrice());
                }});
            if (couponResp.isValid()) {
                finalPrice = couponResp.getFinalPrice(); // Giá sau khi giảm
            }
        }

        // ── BƯỚC 3: Tạo ticket ID ──
        String ticketId = generateTicketId();

        // ── BƯỚC 4: Tạo và lưu Ticket ──
        Ticket ticket = Ticket.builder()
                .id(ticketId)
                .tripId(req.getTripId())
                .customerId(req.getCustomerId())
                .customerName(req.getCustomerName())
                .phone(req.getPhone())
                .email(req.getEmail())
                .seats(serializeSeats(req.getSeats())) // List<String> → JSON string
                .pickupPointId(req.getPickupPointId())
                .dropoffPointId(req.getDropoffPointId())
                .totalPrice(finalPrice)
                .paymentMethod(req.getPaymentMethod())
                .status(Ticket.Status.CONFIRMED) // Đã khóa ghế thành công → CONFIRMED
                // Denormalized trip info (copy từ request để hiển thị vé)
                .fromCity(req.getFromCity())
                .toCity(req.getToCity())
                .tripDate(req.getTripDate())
                .departureTime(req.getDepartureTime())
                .arrivalTime(req.getArrivalTime())
                .build();

        Ticket saved = ticketRepository.save(ticket);
        log.info("✅ Ticket created: {}", ticketId);

        // ── BƯỚC 5: Gửi Kafka event (async notification) ──
        // Nếu Kafka lỗi → vé vẫn lưu DB, không rollback
        bookingEventProducer.sendBookingConfirmed(saved);

        return toResponse(saved);
    }

    /**
     * Lấy chi tiết 1 vé theo ID
     * GET /api/tickets/{id}
     */
    public OrderDto.TicketResponse getTicketById(String id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy vé: " + id));
        return toResponse(ticket);
    }

    /**
     * Tìm vé theo SĐT — dùng cho TicketLookupPage (user)
     * GET /api/tickets/search?phone=0912345678
     *
     * Trả về danh sách vé của SĐT đó, sắp xếp mới nhất trước
     */
    public List<OrderDto.TicketResponse> searchByPhone(String phone) {
        return ticketRepository.findByPhoneOrderByBookedAtDesc(phone)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Lấy vé của 1 khách hàng — dùng cho ProfilePage
     * GET /api/tickets/search?customerId=1
     */
    public List<OrderDto.TicketResponse> getMyTickets(Long customerId) {
        return ticketRepository.findByCustomerIdOrderByBookedAtDesc(customerId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Admin: Lấy tất cả vé (phân trang)
     * GET /api/admin/tickets?page=0&size=20
     */
    public Page<OrderDto.TicketResponse> getAllTickets(Pageable pageable) {
        return ticketRepository.findAllByOrderByBookedAtDesc(pageable).map(this::toResponse);
    }

    /**
     * Admin: Thống kê vé — dùng cho Dashboard
     * GET /api/admin/stats
     *
     * Tính toán trong memory (load tất cả vé → filter):
     * - totalTickets     : tổng số vé
     * - confirmedTickets : vé CONFIRMED
     * - cancelledTickets : vé CANCELLED
     * - totalRevenue     : tổng tiền vé CONFIRMED
     * - todayTickets     : vé có tripDate = hôm nay
     * - todayRevenue     : tiền vé hôm nay (CONFIRMED)
     *
     * ⚠️ Performance: load findAll() có thể chậm khi vé > 10,000
     * → Nên dùng COUNT query riêng khi scale lớn
     */
    public OrderDto.StatsResponse getStats() {
        List<Ticket> all = ticketRepository.findAll();
        String today = LocalDate.now().toString(); // "2024-07-09"

        // Đếm vé theo trạng thái
        long confirmed = all.stream().filter(t -> t.getStatus() == Ticket.Status.CONFIRMED).count();
        long cancelled = all.stream().filter(t -> t.getStatus() == Ticket.Status.CANCELLED).count();

        // Tính tổng doanh thu (chỉ vé CONFIRMED)
        BigDecimal totalRevenue = all.stream()
                .filter(t -> t.getStatus() == Ticket.Status.CONFIRMED)
                .map(Ticket::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Lọc vé hôm nay
        List<Ticket> todayList = all.stream()
                .filter(t -> t.getTripDate() != null && t.getTripDate().equals(today))
                .collect(Collectors.toList());
        long todayTickets = todayList.size();
        BigDecimal todayRevenue = todayList.stream()
                .filter(t -> t.getStatus() == Ticket.Status.CONFIRMED)
                .map(Ticket::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return OrderDto.StatsResponse.builder()
                .totalTickets(all.size())
                .confirmedTickets(confirmed)
                .cancelledTickets(cancelled)
                .totalRevenue(totalRevenue)
                .todayTickets(todayTickets)
                .todayRevenue(todayRevenue)
                .build();
    }

    /**
     * Hủy vé
     * PUT /api/tickets/{id}/cancel
     *
     * Đặt status = CANCELLED
     *
     * ⚠️ Chưa hoàn tiền tự động (cần tích hợp payment gateway)
     * ⚠️ Chưa mở lại ghế trong trip-service (cần gọi Feign unlock)
     */
    @Transactional
    public OrderDto.TicketResponse cancelTicket(String id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy vé: " + id));

        if (ticket.getStatus() == Ticket.Status.CANCELLED) {
            throw new IllegalStateException("Vé đã bị hủy trước đó");
        }

        ticket.setStatus(Ticket.Status.CANCELLED);
        log.info("Ticket {} cancelled", id);
        return toResponse(ticketRepository.save(ticket));
    }

    // ════════════════════════════════════════════════════════
    // 2. COUPON OPERATIONS — Mã giảm giá
    // ════════════════════════════════════════════════════════

    /**
     * Áp dụng mã giảm giá
     *
     * Logic:
     * 1. Tìm coupon theo code (phải active=true)
     * 2. Nếu không tìm thấy → valid=false, message="Mã không hợp lệ"
     * 3. Kiểm tra usedCount < maxUses (còn lượt)
     * 4. Tính discountAmount = originalPrice × discountRate
     * 5. finalPrice = originalPrice - discountAmount
     *
     * ⚠️ Chưa cộng usedCount (nên cộng khi thanh toán thành công)
     * ⚠️ Race condition: 2 người dùng cùng mã 1 lúc có thể vượt maxUses
     */
    public OrderDto.CouponResponse applyCoupon(OrderDto.CouponRequest req) {
        return couponRepository.findByCodeAndActiveTrue(req.getCode().toUpperCase())
                .map(coupon -> {
                    // Kiểm tra còn lượt sử dụng
                    if (coupon.getUsedCount() >= coupon.getMaxUses()) {
                        return OrderDto.CouponResponse.builder()
                                .valid(false)
                                .message("Mã giảm giá đã hết lượt sử dụng")
                                .build();
                    }
                    // Tính số tiền giảm
                    BigDecimal discountAmt = req.getOriginalPrice()
                            .multiply(BigDecimal.valueOf(coupon.getDiscountRate()))
                            .setScale(0, RoundingMode.HALF_UP); // Làm tròn đến VNĐ
                    BigDecimal finalPrice = req.getOriginalPrice().subtract(discountAmt);

                    return OrderDto.CouponResponse.builder()
                            .valid(true)
                            .code(coupon.getCode())
                            .discountRate(coupon.getDiscountRate())
                            .discountAmount(discountAmt)
                            .finalPrice(finalPrice)
                            .message("Áp dụng mã giảm giá thành công!")
                            .build();
                })
                .orElse(OrderDto.CouponResponse.builder()
                        .valid(false)
                        .message("Mã giảm giá không hợp lệ hoặc đã hết hạn")
                        .build());
    }

    // ════════════════════════════════════════════════════════
    // 3. PAYMENT PROCESSING — Thanh toán (Mock)
    // ════════════════════════════════════════════════════════

    /**
     * Xử lý thanh toán (MOCK — luôn thành công)
     *
     * ⚠️ Hiện tại là giả lập — không tích hợp payment gateway thực
     * TODO: Tích hợp với MoMo API, VNPay API, ZaloPay API
     *
     * Tạo transactionId ngẫu nhiên: "TXN" + 12 ký tự UUID
     */
    public OrderDto.PaymentResponse processPayment(OrderDto.PaymentRequest req) {
        log.info("Processing payment for ticket {} via {}", req.getTicketId(), req.getPaymentMethod());
        // Tạo mã giao dịch ngẫu nhiên
        String transactionId = "TXN" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();

        return OrderDto.PaymentResponse.builder()
                .success(true) // Mock: luôn thành công
                .transactionId(transactionId)
                .message("Thanh toán thành công qua " + req.getPaymentMethod())
                .build();
    }

    // ════════════════════════════════════════════════════════
    // 4. ADMIN OPERATIONS — Quản lý vé
    // ════════════════════════════════════════════════════════

    /**
     * Admin: Tìm kiếm vé theo từ khóa
     * Tìm theo: tên khách, SĐT, mã vé
     */
    public List<OrderDto.TicketResponse> searchTicketsAdmin(String q) {
        return ticketRepository.searchAdmin(q.toLowerCase()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Admin: Thay đổi trạng thái vé
     * PUT /api/admin/tickets/{id}/status
     *
     * Các trạng thái: PENDING, CONFIRMED, CANCELLED, REFUNDED, USED
     */
    @Transactional
    public OrderDto.TicketResponse updateTicketStatus(String id, String status) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy vé: " + id));
        ticket.setStatus(Ticket.Status.valueOf(status)); // String → Enum
        log.info("Ticket {} status updated to {}", id, status);
        return toResponse(ticketRepository.save(ticket));
    }

    /**
     * Admin: Xóa vé (hard delete — xóa vĩnh viễn)
     * DELETE /api/admin/tickets/{id}
     *
     * ⚠️ Không thể khôi phục sau khi xóa
     * ⚠️ Chưa mở lại ghế trong trip-service
     */
    @Transactional
    public void deleteTicket(String id) {
        if (!ticketRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy vé: " + id);
        }
        ticketRepository.deleteById(id);
        log.info("Ticket {} deleted", id);
    }

    /**
     * Admin: Lấy tất cả vé của 1 chuyến đi
     * Dùng cho: TripsPage — hiển thị bản đồ ghế đã đặt trong modal chi tiết
     */
    public List<OrderDto.TicketResponse> getTicketsByTripId(Long tripId) {
        return ticketRepository.findByTripIdOrderByBookedAtDesc(tripId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Admin: Xuất tất cả vé (không phân trang)
     * Dùng cho export CSV/Excel trên frontend admin
     */
    public List<OrderDto.TicketResponse> exportTickets() {
        return ticketRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ════════════════════════════════════════════════════════
    // ── PRIVATE HELPER METHODS ──
    // ════════════════════════════════════════════════════════

    /**
     * Tạo ticket ID theo pattern: "VV" + yyyyMMddHHmm + "-" + 4 random chars
     * VD: VV202406220015-ABCD
     *
     * UUID.randomUUID(): tạo UUID ngẫu nhiên
     * substring(0, 4): lấy 4 ký tự đầu
     * toUpperCase(): viết hoa
     */
    private String generateTicketId() {
        String ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmm"));
        String rnd = UUID.randomUUID().toString().replace("-", "").substring(0, 4).toUpperCase();
        return "VV" + ts + rnd;
    }

    /**
     * Serialize List<String> → JSON string
     * Input : ["A1", "A2"]
     * Output: "[\"A1\",\"A2\"]"
     */
    private String serializeSeats(List<String> seats) {
        try {
            return objectMapper.writeValueAsString(seats);
        } catch (Exception e) {
            return "[]"; // Fallback an toàn
        }
    }

    /**
     * Parse JSON string → List<String>
     * Input : "[\"A1\",\"A2\"]"
     * Output: ["A1", "A2"]
     * Nếu null/blank hoặc lỗi → trả về list rỗng
     */
    private List<String> parseSeats(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>(); // Tránh crash nếu JSON corrupt
        }
    }

    /**
     * Chuyển Ticket entity → TicketResponse DTO
     *
     * Tại sao cần convert?
     * → Entity chứa LocalDateTime (bookedAt) → cần convert sang String để JSON
     * → Entity chứa Status enum → cần convert sang String
     * → Entity chứa seats JSON string → cần parse sang List<String>
     */
    private OrderDto.TicketResponse toResponse(Ticket t) {
        return OrderDto.TicketResponse.builder()
                .id(t.getId())
                .tripId(t.getTripId())
                .customerId(t.getCustomerId())
                .customerName(t.getCustomerName())
                .phone(t.getPhone())
                .email(t.getEmail())
                .seats(parseSeats(t.getSeats())) // JSON string → List<String>
                .pickupPointId(t.getPickupPointId())
                .dropoffPointId(t.getDropoffPointId())
                .totalPrice(t.getTotalPrice())
                .paymentMethod(t.getPaymentMethod())
                .status(t.getStatus().name()) // Enum → String
                .fromCity(t.getFromCity())
                .toCity(t.getToCity())
                .tripDate(t.getTripDate())
                .departureTime(t.getDepartureTime())
                .arrivalTime(t.getArrivalTime())
                .bookedAt(t.getBookedAt() != null ? t.getBookedAt().toString() : null) // LocalDateTime → String
                .build();
    }
}
