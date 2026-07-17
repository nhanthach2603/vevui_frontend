package com.vevui.orderservice.entity; // Package chứa Entity ánh xạ với DB

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  Entity: Coupon — Ánh xạ với bảng `coupons` trong db_orders
 *
 *  Coupon là MÃ GIẢM GIÁ — khách nhập mã khi đặt vé để được giảm tiền.
 *
 *  Ví dụ:
 *  - code: "SUMMER10", discountRate: 0.10 (giảm 10%)
 *  - code: "WELCOME20", discountRate: 0.20 (giảm 20%)
 *
 *  Logic sử dụng trong OrderService.applyCoupon():
 *  1. Tìm coupon theo code (phải active=true)
 *  2. Kiểm tra usedCount < maxUses (còn lượt sử dụng)
 *  3. Tính discountAmount = originalPrice × discountRate
 *  4. Trả về finalPrice = originalPrice - discountAmount
 *
 *  ⚠️ Chưa có transaction isolation cho usedCount
 *  → Race condition nếu 2 người dùng cùng mã 1 lúc (hiếm gặp)
 * ╚══════════════════════════════════════════════════════════╝
 */
@Entity
@Table(name = "coupons") // Tên bảng trong MySQL db_orders
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ID tự tăng
    private Long id;

    /**
     * Mã giảm giá — viết hoa, unique
     * VD: "SUMMER10", "WELCOME20", "TET2024"
     * Khi tìm kiếm tự động chuyển thành uppercase
     */
    @Column(unique = true, nullable = false, length = 20)
    private String code;

    /**
     * Tỷ lệ giảm giá (0.0 - 1.0)
     * VD: 0.10 = giảm 10%, 0.25 = giảm 25%
     * Dùng Double thay vì BigDecimal vì tỷ lệ nhỏ, không cần precision cao
     */
    @Column(nullable = false)
    private Double discountRate;

    /**
     * Số lần sử dụng tối đa của mã này
     * Mặc định: 100 lần
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer maxUses = 100;

    /**
     * Số lần đã sử dụng
     * Tăng lên 1 mỗi khi khách áp dụng mã thành công
     * Khi usedCount >= maxUses → mã hết lượt
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer usedCount = 0;

    /**
     * Trạng thái hoạt động
     * true: mã đang active, có thể sử dụng
     * false: mã đã bị vô hiệu hóa (hết hạn, admin tắt)
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp // Tự động gán thời điểm tạo
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
