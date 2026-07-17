package com.vevui.tripservice.entity; // Package chứa các Entity ánh xạ với database db_trips

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp; // Tự động gán thời điểm tạo record
import org.hibernate.annotations.UpdateTimestamp;   // Tự động cập nhật thời điểm sửa record

import java.math.BigDecimal; // Kiểu tiền tệ chính xác (không bị lỗi làm tròn như float/double)
import java.time.LocalDateTime;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  Entity: Route — Ánh xạ với bảng `routes` trong db_trips
 *
 *  Route là một TUYẾN CỐ ĐỊNH giữa 2 thành phố.
 *  Ví dụ: Hà Nội → Đà Nẵng (700km, 14 tiếng, giá cơ bản 350.000đ)
 *
 *  Quan hệ:
 *  Route ←──(1 tuyến có nhiều chuyến)──→ Trip (N)
 * ╚══════════════════════════════════════════════════════════╝
 */
@Entity                // Hibernate sẽ ánh xạ class này với bảng trong MySQL
@Table(name = "routes") // Tên bảng trong DB là "routes"
@Data                  // Lombok: sinh getter/setter/toString/equals/hashCode
@Builder               // Lombok: Builder pattern — Route.builder().fromCity("HN")...
@NoArgsConstructor     // Lombok: Constructor không tham số (bắt buộc với JPA)
@AllArgsConstructor    // Lombok: Constructor đầy đủ tham số
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ID tự tăng (AUTO_INCREMENT)
    private Long id;

    @Column(nullable = false, length = 100) // NOT NULL, tối đa 100 ký tự
    private String fromCity; // Tên thành phố khởi hành (ví dụ: "Hà Nội", "TP.HCM")

    @Column(nullable = false, length = 100)
    private String toCity;   // Tên thành phố đến

    @Column(nullable = false)
    private Integer distanceKm; // Khoảng cách giữa 2 thành phố (km) — dùng để tính giá

    @Column(nullable = false)
    private Integer durationMinutes; // Thời gian di chuyển ước tính (phút) — ví dụ: 840 = 14 tiếng

    @Column(nullable = false, precision = 12, scale = 0)
    private BigDecimal basePrice; // Giá vé cơ bản (VNĐ) — precision=12: tối đa 12 chữ số, scale=0: không có số thập phân

    @Column(length = 500)
    private String stops; // Các điểm dừng giữa đường, phân cách bởi dấu phẩy
                          // Ví dụ: "Thanh Hóa,Nghệ An,Hà Tĩnh,Quảng Bình"

    @Column(length = 500)
    private String imageUrl; // URL ảnh đại diện của tuyến — dùng hiển thị trên frontend

    @Column(nullable = false)
    @Builder.Default
    private Boolean popular = false; // true = tuyến phổ biến → hiển thị ở trang chủ
                                      // Admin có thể đặt popular=true cho các tuyến hot

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;   // true = tuyến đang hoạt động, false = đã ẩn/xóa mềm

    @CreationTimestamp
    @Column(updatable = false) // Không cho phép cập nhật sau khi tạo
    private LocalDateTime createdAt; // Thời điểm tạo tuyến

    @UpdateTimestamp
    private LocalDateTime updatedAt; // Thời điểm cập nhật lần cuối
}
