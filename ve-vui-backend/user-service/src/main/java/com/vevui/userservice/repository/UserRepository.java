package com.vevui.userservice.repository; // Package chứa các Repository — tầng truy cập database

import com.vevui.userservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository; // Interface có sẵn đầy đủ CRUD (findAll, findById, save, delete...)
import org.springframework.data.jpa.repository.Query;         // Dùng để viết câu truy vấn JPQL tùy chỉnh
import org.springframework.data.repository.query.Param;       // Dùng để đặt tên tham số trong câu JPQL
import org.springframework.stereotype.Repository;             // Đánh dấu đây là Bean Repository (Spring quản lý)

import java.util.List;
import java.util.Optional; // Bao bọc kết quả trả về, tránh NullPointerException

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  UserRepository — Tầng truy cập database cho bảng `users`
 *
 *  Kế thừa JpaRepository<User, Long>:
 *  - User  : Entity được quản lý
 *  - Long  : Kiểu dữ liệu của khóa chính (id)
 *
 *  Spring Data JPA sẽ TỰ ĐỘNG sinh SQL dựa theo tên method
 *  (findByEmail → SELECT * FROM users WHERE email = ?)
 * ╚══════════════════════════════════════════════════════════╝
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Tìm user theo email (dùng khi đăng nhập)
    // Spring tự sinh: SELECT * FROM users WHERE email = ?
    Optional<User> findByEmail(String email);

    // Tìm user theo số điện thoại (kiểm tra trùng số điện thoại)
    // Spring tự sinh: SELECT * FROM users WHERE phone = ?
    Optional<User> findByPhone(String phone);

    // Kiểm tra email đã tồn tại chưa — trả về true/false
    // Spring tự sinh: SELECT COUNT(*) > 0 FROM users WHERE email = ?
    boolean existsByEmail(String email);

    // Kiểm tra số điện thoại đã tồn tại chưa — trả về true/false
    // Spring tự sinh: SELECT COUNT(*) > 0 FROM users WHERE phone = ?
    boolean existsByPhone(String phone);

    // Tìm user theo refresh token (dùng khi user muốn làm mới access token)
    // Spring tự sinh: SELECT * FROM users WHERE refresh_token = ?
    Optional<User> findByRefreshToken(String refreshToken);

    /**
     * Tìm kiếm user theo từ khóa — tìm trong 3 cột: fullName, email, phone
     *
     * @Query: dùng JPQL (Java Persistence Query Language) thay vì SQL thuần
     * - LOWER(): chuyển về chữ thường để tìm không phân biệt hoa/thường
     * - LIKE %:q%: tìm chuỗi chứa từ khóa ở bất kỳ vị trí nào
     * - @Param("q"): liên kết tham số Java với tên ":q" trong câu truy vấn
     */
    @Query("SELECT u FROM User u WHERE LOWER(u.fullName) LIKE %:q% OR LOWER(u.email) LIKE %:q% OR u.phone LIKE %:q%")
    List<User> searchByKeyword(@Param("q") String q);
}

