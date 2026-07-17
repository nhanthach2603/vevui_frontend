package com.vevui.orderservice.entity; // Package chứa Entity ánh xạ với DB

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  Entity: Ticket — Ánh xạ với bảng `tickets` trong db_orders
 *
 *  Ticket là VÉ XE — đại diện cho 1 lần đặt vé của khách hàng.
 *
 *  Mỗi Ticket chứa:
 *  - Thông tin khách hàng (tên, SĐT, email)
 *  - Thông tin chuyến đi (tripId, seats, fromCity, toCity, tripDate...)
 *  - Thông tin thanh toán (totalPrice, paymentMethod, status)
 *
 *  Ticket ID không dùng auto-increment mà dùng pattern:
 *  "VV" + yyyyMMddHHmm + 4 ký tự ngẫu nhiên
 *  VD: VV202406220015-ABCD
 *
 *  Denormalized fields (fromCity, toCity, tripDate...):
 *  → Copy từ trip-service vào khi tạo vé
 *  → Giúp hiển thị thông tin vé mà không cần gọi trip-service
 *  → Trade-off: dữ liệu có thể stale nếu trip thay đổi
 *
 *  Status flow:
 *  PENDING → CONFIRMED → USED
 *                 ↓
 *              CANCELLED → REFUNDED
 * ╚══════════════════════════════════════════════════════════╝
 */
@Entity
@Table(name = "tickets") // Tên bảng trong MySQL db_orders
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {

    /**
     * Mã vé — không phải số tự tăng mà là string tùy chỉnh
     * VD: "VV202406220015-ABCD"
     * Length 30: đủ cho pattern "VV" + 12 ký tự thời gian + "-" + 4 ký tự ngẫu nhiên
     */
    @Id
    @Column(length = 30)
    private String id;

    /**
     * ID chuyến đi — tham chiếu đến trip-service
     * ⚠️ Không dùng @ManyToOne vì trip-service là microservice riêng
     * → Chỉ lưu ID, không có JPA relationship
     */
    @Column(nullable = false)
    private Long tripId;

    /**
     * ID khách hàng — null nếu guest booking (khách không đăng nhập)
     * Tham chiếu đến user-service qua ID (không JPA relationship)
     */
    private Long customerId;

    @Column(nullable = false, length = 100)
    private String customerName; // Tên khách hàng

    @Column(nullable = false, length = 15)
    private String phone; // Số điện thoại liên hệ

    @Column(nullable = false, length = 100)
    private String email; // Email nhận thông báo

    /**
     * Danh sách ghế đã đặt — lưu dạng JSON string
     * Ví dụ: '["A1","A2"]'
     * Length 500: đủ cho khoảng 20-25 ghế (mỗi ghế ~15 ký tự JSON)
     */
    @Column(nullable = false, length = 500)
    private String seats;

    private Long pickupPointId;  // ID điểm đón (tham chiếu pickup_points trong trip-service)
    private Long dropoffPointId; // ID điểm trả

    @Column(nullable = false, precision = 12, scale = 0)
    private BigDecimal totalPrice; // Tổng tiền thanh toán (VNĐ)

    @Column(length = 50)
    private String paymentMethod; // Phương thức: MOMO, CASH, VNPay, CREDIT_CARD...

    /**
     * Trạng thái vé
     * - PENDING   : Vé đang chờ xử lý (chưa thanh toán)
     * - CONFIRMED : Vé đã xác nhận (đã thanh toán thành công)
     * - CANCELLED : Vé đã bị hủy
     * - REFUNDED  : Vé đã hoàn tiền
     * - USED      : Vé đã sử dụng (khách đã lên xe)
     */
    @Enumerated(EnumType.STRING) // Lưu tên enum: "CONFIRMED" thay vì số 1
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.PENDING; // Mặc định khi tạo mới

    // ── Denormalized trip info (copy từ trip-service) ──
    // Lưu để hiển thị vé mà không cần gọi trip-service mỗi lần

    @Column(length = 100)
    private String fromCity; // Thành phố đi: "Hà Nội"

    @Column(length = 100)
    private String toCity; // Thành phố đến: "Đà Nẵng"

    private String tripDate; // Ngày đi: "2024-07-09" (String thay vì LocalDate vì chỉ hiển thị)

    private String departureTime; // Giờ khởi hành: "08:30"

    private String arrivalTime; // Giờ đến dự kiến: "22:30"

    @CreationTimestamp // Tự động gán = LocalDateTime.now() khi INSERT
    @Column(updatable = false) // Không cho sửa sau khi tạo
    private LocalDateTime bookedAt; // Thời điểm đặt vé

    @UpdateTimestamp // Tự động cập nhật = LocalDateTime.now() khi UPDATE
    private LocalDateTime updatedAt; // Thời điểm cập nhật cuối

    /**
     * Enum trạng thái vé — ánh xạ với Status trong DB
     */
    public enum Status {
        PENDING, CONFIRMED, CANCELLED, REFUNDED, USED
    }
}
