package com.vevui.tripservice.entity; // Package chứa các Entity

import jakarta.persistence.*;
import lombok.*;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  Entity: PickupPoint — Ánh xạ với bảng `pickup_points`
 *
 *  PickupPoint là các điểm đón/trả khách trong 1 thành phố.
 *  Mỗi thành phố có thể có nhiều điểm đón và điểm trả khác nhau.
 *
 *  Ví dụ cho TP.HCM:
 *  - "Bến xe Miền Đông" — PICKUP, timeOffset: "0 phút" (điểm xuất phát)
 *  - "Bến xe Miền Tây"  — PICKUP, timeOffset: "+30 phút" (xe qua sau 30 phút)
 *  - "Q.1, Hồ Chí Minh" — DROPOFF, timeOffset: "+15 phút" (trả khách sau điểm đến)
 * ╚══════════════════════════════════════════════════════════╝
 */
@Entity
@Table(name = "pickup_points") // Tên bảng trong MySQL
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PickupPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ID tự tăng
    private Long id;

    @Column(nullable = false, length = 100)
    private String city; // Tên thành phố — phải khớp với fromCity hoặc toCity trong Route
                         // Ví dụ: "Hà Nội", "TP.HCM", "Đà Nẵng"

    @Column(nullable = false, length = 255)
    private String name; // Tên địa điểm cụ thể — ví dụ: "Bến xe Mỹ Đình", "Ngã tư Hàng Xanh"

    @Column(length = 50)
    private String timeOffset; // Độ lệch thời gian so với giờ khởi hành chính thức
                               // Ví dụ: "-30 phút" (đón 30 phút trước), "0 phút" (đúng giờ), "+10 phút"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PointType type; // Loại điểm: PICKUP (đón), DROPOFF (trả), BOTH (cả hai)

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true; // true = điểm đang hoạt động, false = đã ẩn

    /**
     * Enum loại điểm đón/trả:
     * - PICKUP  : Chỉ đón khách (điểm khởi hành)
     * - DROPOFF : Chỉ trả khách (điểm đến)
     * - BOTH    : Vừa đón vừa trả (điểm trung gian)
     */
    public enum PointType {
        PICKUP, DROPOFF, BOTH
    }
}
