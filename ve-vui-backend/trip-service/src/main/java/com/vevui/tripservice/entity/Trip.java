package com.vevui.tripservice.entity; // Package chứa các Entity

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;      // Ngày (không có giờ phút giây) — VD: 2024-07-09
import java.time.LocalDateTime;  // Ngày + giờ đầy đủ
import java.time.LocalTime;      // Chỉ giờ (không có ngày) — VD: 08:30
import java.util.List;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  Entity: Trip — Ánh xạ với bảng `trips` trong db_trips
 *
 *  Trip là một CHUYẾN ĐI CỤ THỂ — kết hợp Tuyến + Xe + Ngày giờ.
 *  Ví dụ: Tuyến HN→ĐN, Xe 51B-123.45, ngày 09/07/2024, 08:30
 *
 *  Quan hệ:
 *  Route (1) ←────── Trip ──────→ Bus (1)
 *
 *  Database Index: idx_trip_route_date
 *  → Tăng tốc truy vấn tìm chuyến theo tuyến + ngày
 *    (đây là query phổ biến nhất khi khách tìm vé)
 * ╚══════════════════════════════════════════════════════════╝
 */
@Entity
@Table(name = "trips", indexes = {
    // Tạo index cho cặp (route_id, trip_date) trong MySQL
    // → Khi search "HN → ĐN ngày 09/07", MySQL dùng index này thay vì quét toàn bảng
    @Index(name = "idx_trip_route_date", columnList = "route_id, trip_date")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ID tự tăng
    private Long id;

    /**
     * Tuyến đường mà chuyến này chạy
     * fetch = EAGER: load thông tin Route cùng lúc (cần thiết vì mọi response đều có route info)
     * @JoinColumn: cột khóa ngoại "route_id" trong bảng trips
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "route_id", nullable = false)
    private Route route; // Tuyến xe: fromCity → toCity

    /**
     * Xe thực hiện chuyến đi này
     * fetch = EAGER: load Bus (và BusType qua EAGER của Bus) cùng lúc
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bus_id", nullable = false)
    private Bus bus; // Xe cụ thể thực hiện chuyến

    @Column(nullable = false)
    private LocalDate tripDate;      // Ngày chạy chuyến — ví dụ: 2024-07-09

    @Column(nullable = false)
    private LocalTime departureTime; // Giờ khởi hành — ví dụ: 08:30

    @Column(nullable = false)
    private LocalTime arrivalTime;   // Giờ dự kiến đến — ví dụ: 22:30

    @Column(nullable = false, precision = 12, scale = 0)
    private BigDecimal price;        // Giá vé của chuyến này (có thể khác basePrice của Route)

    @Column(nullable = false)
    private Integer availableSeats;  // Số ghế còn trống (giảm dần khi có người đặt)
                                     // Khi tạo Trip mới: availableSeats = busType.totalSeats

    /**
     * Danh sách ghế đã được đặt — lưu dạng JSON string
     * Ví dụ: ["A1","A2","B3"] — lưu trong 1 cột TEXT (tối đa 1000 ký tự)
     *
     * Tại sao không dùng bảng riêng?
     * → Đơn giản hóa, tránh JOIN phức tạp, phù hợp với microservices
     * → TripService xử lý parse/serialize bằng ObjectMapper
     */
    @Column(length = 1000)
    @Builder.Default
    private String bookedSeats = ""; // JSON array string ví dụ: ["A1","A2"]

    @Enumerated(EnumType.STRING)     // Lưu tên enum: "SCHEDULED", "DEPARTED"...
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.SCHEDULED; // Trạng thái mặc định khi tạo là SCHEDULED

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt; // Thời điểm tạo chuyến

    @UpdateTimestamp
    private LocalDateTime updatedAt; // Thời điểm cập nhật lần cuối

    /**
     * Enum trạng thái của chuyến đi:
     * - SCHEDULED : Chuyến đã lên lịch — đang bán vé
     * - DEPARTED  : Xe đã xuất bến — không thể đặt thêm
     * - CANCELLED : Chuyến bị hủy (soft delete) — hoàn tiền cho khách
     * - COMPLETED : Chuyến đã hoàn thành — xe đã đến điểm đến
     */
    public enum Status {
        SCHEDULED, DEPARTED, CANCELLED, COMPLETED
    }
}
