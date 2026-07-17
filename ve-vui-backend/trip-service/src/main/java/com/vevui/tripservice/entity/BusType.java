package com.vevui.tripservice.entity; // Package chứa các Entity

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  Entity: BusType — Ánh xạ với bảng `bus_types` trong db_trips
 *
 *  BusType là LOẠI XE (template/mẫu) — định nghĩa đặc tính chung:
 *  - STANDARD : Xe ghế thường, 40-45 chỗ
 *  - VIP       : Xe ghế rộng, dịch vụ tốt hơn, 32-36 chỗ
 *  - SLEEPER   : Xe giường nằm, 2 tầng, 36-40 chỗ
 *  - LIMOUSINE : Xe sang, ít chỗ (dưới 20), tiện nghi cao cấp
 *
 *  Quan hệ: BusType ──(1 loại có nhiều xe)──→ Bus (N)
 * ╚══════════════════════════════════════════════════════════╝
 */
@Entity
@Table(name = "bus_types") // Tên bảng trong MySQL
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ID tự tăng
    private Long id;

    @Column(nullable = false, length = 100)
    private String name; // Tên hiển thị đầy đủ — ví dụ: "Xe Giường Nằm 2 Tầng"

    @Column(unique = true, nullable = false, length = 20)
    private String code; // Mã code ngắn — STANDARD | VIP | SLEEPER | LIMOUSINE
                         // UNIQUE: mỗi loại xe chỉ có 1 code duy nhất
                         // Dùng trong code để phân loại sơ đồ ghế (seat map)

    @Column(nullable = false)
    private Integer totalSeats; // Tổng số chỗ ngồi/nằm — dùng khi tạo chuyến đi mới
                                // availableSeats trong Trip sẽ được init = totalSeats này

    @Column(length = 255)
    private String description; // Mô tả chi tiết dịch vụ — hiển thị cho khách hàng

    @Column(length = 10)
    @Builder.Default
    private String icon = "🚌"; // Icon emoji hiển thị trên UI — mặc định 🚌
                                // LIMOUSINE → 🚐, SLEEPER → 🛏️...
}
