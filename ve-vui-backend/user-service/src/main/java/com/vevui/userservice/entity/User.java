package com.vevui.userservice.entity; // Package chứa các Entity (lớp ánh xạ với bảng DB)

// ── JPA annotations — dùng để ánh xạ Java class ↔ bảng MySQL ──
import jakarta.persistence.*;
import lombok.*;                                          // Lombok tự sinh getter/setter/constructor
import org.hibernate.annotations.CreationTimestamp;       // Tự động gán thời gian tạo record
import org.hibernate.annotations.UpdateTimestamp;         // Tự động cập nhật thời gian sửa record

import java.time.LocalDateTime;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  Entity: User — Ánh xạ với bảng `users` trong database db_users
 *
 *  Một User đại diện cho một tài khoản trong hệ thống.
 *  Hibernate sẽ tự động tạo/cập nhật bảng `users` dựa theo class này.
 * ╚══════════════════════════════════════════════════════════╝
 */
@Entity                     // Đánh dấu đây là một Entity — Hibernate sẽ ánh xạ class này thành bảng DB
@Table(name = "users")      // Chỉ định tên bảng trong MySQL là "users"
@Data                       // Lombok: tự sinh getter, setter, toString, equals, hashCode
@Builder                    // Lombok: cho phép dùng pattern Builder để tạo object (User.builder()...)
@NoArgsConstructor          // Lombok: sinh constructor không tham số (bắt buộc cho JPA)
@AllArgsConstructor         // Lombok: sinh constructor với đầy đủ tham số
public class User {

    @Id                                                    // Đánh dấu field này là khóa chính (Primary Key)
    @GeneratedValue(strategy = GenerationType.IDENTITY)    // ID tự tăng (AUTO_INCREMENT trong MySQL)
    private Long id;

    @Column(nullable = false, length = 100)                // Cột NOT NULL, tối đa 100 ký tự
    private String fullName;                               // Họ và tên đầy đủ của người dùng

    @Column(unique = true, nullable = false, length = 100) // Email là UNIQUE (không trùng), NOT NULL
    private String email;                                  // Email — dùng để đăng nhập

    @Column(nullable = false)                              // Password NOT NULL (lưu dạng BCrypt hash)
    private String password;                               // Mật khẩu đã được mã hóa BCrypt

    @Column(unique = true, length = 15)                    // Số điện thoại UNIQUE, tối đa 15 ký tự (có thể null)
    private String phone;                                  // Số điện thoại liên hệ

    @Enumerated(EnumType.STRING)                           // Lưu enum dưới dạng String trong DB (ví dụ: "USER", "ADMIN")
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.USER;                         // Vai trò mặc định khi tạo mới là USER

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;                        // true = tài khoản đang hoạt động, false = bị khóa/xóa mềm

    @Column(length = 255)
    private String refreshToken;                           // Lưu refresh token hiện tại của user (để xác thực làm mới JWT)

    @CreationTimestamp                                     // Hibernate tự gán giá trị = thời điểm INSERT
    @Column(updatable = false)                             // Không cho phép cập nhật sau khi đã tạo
    private LocalDateTime createdAt;                       // Thời gian tạo tài khoản

    @UpdateTimestamp                                       // Hibernate tự cập nhật mỗi khi record thay đổi
    private LocalDateTime updatedAt;                       // Thời gian cập nhật lần cuối

    /**
     * Enum định nghĩa các vai trò trong hệ thống:
     * - USER  : Người dùng thông thường — chỉ đặt vé, xem lịch sử
     * - ADMIN : Quản trị viên — toàn quyền quản lý hệ thống
     * - STAFF : Nhân viên — quyền hạn giới hạn (chưa dùng trong phiên bản hiện tại)
     */
    public enum Role {
        USER, ADMIN, STAFF
    }
}

