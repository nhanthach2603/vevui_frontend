package com.vevui.orderservice.repository; // Package chứa Repository

import com.vevui.orderservice.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * CouponRepository — Tầng truy cập bảng `coupons` trong db_orders
 *
 * Đơn giản vì chỉ có 1 query tùy chỉnh:
 * - findByCodeAndActiveTrue(): tìm mã giảm giá đang active
 */
@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {

    /**
     * Tìm mã giảm giá theo code (phải đang active)
     * Spring tự sinh: SELECT * FROM coupons WHERE code = ? AND active = true
     *
     * Dùng trong OrderService.applyCoupon():
     * 1. Customer nhập mã "SUMMER10"
     * 2. findByCodeAndActiveTrue("SUMMER10") → Optional<Coupon>
     * 3. Nếu tìm thấy → kiểm tra usedCount < maxUses → tính giảm giá
     * 4. Nếu không tìm thấy → trả về "Mã không hợp lệ"
     */
    Optional<Coupon> findByCodeAndActiveTrue(String code);
}
