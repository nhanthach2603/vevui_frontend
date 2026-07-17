package com.vevui.orderservice.dto; // Package chứa Data Transfer Object

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  OrderDto — Tập hợp tất cả DTO của Order Service
 *
 *  DTO (Data Transfer Object): lớp dữ liệu dùng để truyền thông tin
 *  giữa các tầng (Controller ↔ Service ↔ DB) và giữa các microservice.
 *
 *  Chiến lược: TẤT CẢ Request/Response đều là static class bên trong OrderDto
 *  → Dễ tìm, dễ import, không cần tạo nhiều file riêng
 *
 *  Các nhóm DTO chính:
 *  1. Ticket   : CreateTicketRequest, TicketResponse, UpdateTicketStatusRequest
 *  2. Coupon   : CouponRequest, CouponResponse
 *  3. Payment  : PaymentRequest, PaymentResponse
 *  4. Stats    : StatsResponse (thống kê cho admin dashboard)
 * ╚══════════════════════════════════════════════════════════╝
 */
public class OrderDto {

    // ════════════════════════════════════════════════════════
    // 1. TICKET DTO — Liên quan đến đặt vé
    // ════════════════════════════════════════════════════════

    /**
     * Request body khi đặt vé mới
     * Dùng cho cả user đặt vé và admin tạo vé
     *
     * Các trường bắt buộc: tripId, customerName, phone, email, seats, totalPrice
     * Các trường tùy chọn: customerId (null nếu guest), couponCode, skipLock
     *
     * skipLock: nếu true → bypass Feign lockSeats (chỉ admin dùng)
     * fromCity, toCity, tripDate...: thông tin trip denormalized để lưu vào Ticket
     *   (không cần query trip-service mỗi lần hiển thị)
     */
    @Data
    public static class CreateTicketRequest {
        private Long tripId;             // ID chuyến đi (bắt buộc)
        private Long customerId;         // ID khách hàng (null nếu guest booking)
        private String customerName;     // Tên khách hàng (bắt buộc)
        private String phone;            // Số điện thoại (bắt buộc)
        private String email;            // Email (bắt buộc)
        private List<String> seats;      // Danh sách ghế đặt: ["A1", "A2"]
        private Long pickupPointId;      // ID điểm đón
        private Long dropoffPointId;     // ID điểm trả
        private BigDecimal totalPrice;   // Tổng tiền (VNĐ)
        private String paymentMethod;    // Phương thức thanh toán: MOMO, CASH, VNPay...
        private String couponCode;       // Mã giảm giá (tùy chọn)
        private Boolean skipLock;        // true = admin bypass khóa ghế (default false)

        // Thông tin trip denormalized (copy từ trip-service) để lưu vào Ticket
        // → Khi hiển thị vé không cần gọi trip-service
        private String fromCity;         // Tên thành phố đi
        private String toCity;           // Tên thành phố đến
        private String tripDate;         // Ngày đi (yyyy-MM-dd)
        private String departureTime;    // Giờ khởi hành (HH:mm)
        private String arrivalTime;      // Giờ đến dự kiến
    }

    /**
     * Response body khi trả về thông tin vé
     * Dùng cho cả GET chi tiết, POST tạo, PUT cập nhật
     *
     * Builder pattern: TicketResponse.builder().id("VV...").status("CONFIRMED")...
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TicketResponse {
        private String id;               // Mã vé: "VV20240622001-ABCD"
        private Long tripId;             // ID chuyến đi
        private Long customerId;         // ID khách hàng (null nếu guest)
        private String customerName;     // Tên khách
        private String phone;            // SĐT
        private String email;            // Email
        private List<String> seats;      // Danh sách ghế
        private Long pickupPointId;      // ID điểm đón
        private Long dropoffPointId;     // ID điểm trả
        private BigDecimal totalPrice;   // Tổng tiền
        private String paymentMethod;    // Phương thức thanh toán
        private String status;           // Trạng thái: PENDING/CONFIRMED/CANCELLED/REFUNDED/USED
        private String fromCity;         // Thành phố đi
        private String toCity;           // Thành phố đến
        private String tripDate;         // Ngày đi
        private String departureTime;    // Giờ khởi hành
        private String arrivalTime;      // Giờ đến
        private String bookedAt;         // Thời điểm đặt vé
    }

    // ════════════════════════════════════════════════════════
    // 2. COUPON DTO — Mã giảm giá
    // ════════════════════════════════════════════════════════

    /**
     * Request body khi áp dụng mã giảm giá
     * code: mã giảm giá (ví dụ: "SUMMER10", "WELCOME20")
     * originalPrice: giá gốc trước khi giảm
     */
    @Data
    public static class CouponRequest {
        private String code;             // Mã giảm giá
        private BigDecimal originalPrice; // Giá gốc
    }

    /**
     * Response body khi kiểm tra mã giảm giá
     * Trả về kết quả: hợp lệ/không hợp lệ, số tiền giảm, giá cuối cùng
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CouponResponse {
        private boolean valid;           // Mã có hợp lệ không
        private String code;             // Mã giảm giá
        private Double discountRate;     // Tỷ lệ giảm: 0.10 = 10%
        private BigDecimal discountAmount; // Số tiền giảm (VNĐ)
        private BigDecimal finalPrice;   // Giá sau khi giảm
        private String message;          // Thông báo: "Áp dụng thành công!" hoặc lỗi
    }

    // ════════════════════════════════════════════════════════
    // 3. PAYMENT DTO — Thanh toán
    // ════════════════════════════════════════════════════════

    /**
     * Request body khi xử lý thanh toán
     * ticketId: mã vé cần thanh toán
     * paymentMethod: MOMO, VNPay, CASH, CREDIT_CARD...
     * amount: số tiền thanh toán
     */
    @Data
    public static class PaymentRequest {
        private String ticketId;         // Mã vé
        private String paymentMethod;    // Phương thức thanh toán
        private BigDecimal amount;       // Số tiền
    }

    /**
     * Response body khi xử lý thanh toán
     * success: thanh toán có thành công không
     * transactionId: mã giao dịch (tạo ngẫu nhiên cho mock)
     * message: thông báo kết quả
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentResponse {
        private boolean success;         // Thanh toán thành công?
        private String transactionId;    // Mã giao dịch: "TXN..."
        private String message;          // Thông báo: "Thanh toán thành công qua MOMO"
    }

    // ════════════════════════════════════════════════════════
    // 4. STATS DTO — Thống kê cho admin dashboard
    // ════════════════════════════════════════════════════════

    /**
     * Response body cho thống kê vé
     * Dùng trên trang Dashboard admin để hiển thị tổng quan
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatsResponse {
        private long totalTickets;       // Tổng số vé
        private long confirmedTickets;   // Vé đã xác nhận (CONFIRMED)
        private long cancelledTickets;   // Vé đã hủy (CANCELLED)
        private BigDecimal totalRevenue; // Tổng doanh thu (chỉ tính vé CONFIRMED)
        private long todayTickets;       // Số vé hôm nay
        private BigDecimal todayRevenue; // Doanh thu hôm nay
    }

    /**
     * Request body khi admin cập nhật trạng thái vé
     * status: PENDING, CONFIRMED, CANCELLED, REFUNDED, USED
     */
    @Data
    public static class UpdateTicketStatusRequest {
        private String status;           // Trạng thái mới
    }
}
