package com.vevui.tripservice.entity; // Package chứa các Entity

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  Entity: Bus — Ánh xạ với bảng `buses` trong db_trips
 *
 *  Bus là XE CỤ THỂ (thực thể thực tế) — có biển số, tên riêng.
 *  Ví dụ: Xe 51B-123.45, loại SLEEPER, đang ACTIVE
 *
 *  Quan hệ:
 *  BusType (N) ←── Bus ──→ Trip (N)
 *  (1 loại xe có nhiều xe cụ thể)
 *  (1 xe cụ thể có thể chạy nhiều chuyến)
 * ╚══════════════════════════════════════════════════════════╝
 */
@Entity
@Table(name = "buses") // Tên bảng trong MySQL
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Bus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ID tự tăng
    private Long id;

    @Column(unique = true, nullable = false, length = 20) // Biển số xe là UNIQUE
    private String plateNumber; // Biển số xe — ví dụ: "51B-123.45", "29A-999.99"

    @Column(nullable = false, length = 100)
    private String name; // Tên thương mại của xe — ví dụ: "Xe VIP 12 Phòng Đôi"

    /**
     * Quan hệ nhiều-một: Nhiều xe cùng 1 loại (BusType)
     * fetch = EAGER: load thông tin BusType cùng lúc load Bus
     *                 (không cần query riêng — phù hợp vì BusType ít thay đổi)
     * @JoinColumn: cột khóa ngoại trong bảng buses là "bus_type_id"
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bus_type_id", nullable = false)
    private BusType busType; // Loại xe: STANDARD, VIP, SLEEPER, LIMOUSINE

    @Enumerated(EnumType.STRING) // Lưu tên enum dạng String trong DB (không lưu số thứ tự)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.ACTIVE; // Trạng thái mặc định khi tạo mới là ACTIVE

    // ── Vi phạm giao thông ──
    @Column(length = 10)
    private String violationDate;    // Ngày phạt (yyyy-MM-dd)

    @Column(length = 10)
    private String violationExpiry;  // Ngày hết phạt (yyyy-MM-dd)

    @Column(length = 500)
    private String violationReason;  // Lý do phạt

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    /**
     * Enum trạng thái hoạt động của xe:
     * - ACTIVE      : Xe đang hoạt động bình thường, sẵn sàng chạy
     * - MAINTENANCE : Xe đang bảo dưỡng/sửa chữa — không thể tạo chuyến mới
     * - INACTIVE    : Xe ngừng hoạt động vĩnh viễn (soft delete)
     */
    public enum Status {
        ACTIVE, MAINTENANCE, INACTIVE
    }
}
