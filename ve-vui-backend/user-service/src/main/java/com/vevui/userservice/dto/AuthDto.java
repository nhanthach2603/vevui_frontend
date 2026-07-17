package com.vevui.userservice.dto; // Package chứa các DTO (Data Transfer Object) — lớp truyền dữ liệu giữa client và server

// ── Các annotation validation từ Jakarta Bean Validation ──
import jakarta.validation.constraints.Email;    // Kiểm tra định dạng email hợp lệ
import jakarta.validation.constraints.NotBlank; // Kiểm tra không rỗng và không chỉ có khoảng trắng
import jakarta.validation.constraints.Pattern;  // Kiểm tra khớp với regex pattern
import jakarta.validation.constraints.Size;     // Kiểm tra độ dài chuỗi
import lombok.Data;                             // Lombok: sinh getter/setter/equals/hashCode/toString

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  AuthDto — Tập hợp các DTO dùng cho chức năng xác thực
 *
 *  Dùng pattern "wrapper class": tất cả DTO được gom vào
 *  trong 1 class AuthDto để gọn gàng, dễ quản lý.
 *
 *  Các DTO trong này:
 *  1. RegisterRequest     — dữ liệu khi đăng ký
 *  2. LoginRequest        — dữ liệu khi đăng nhập
 *  3. RefreshRequest      — dữ liệu khi làm mới token
 *  4. AuthResponse        — kết quả trả về sau đăng nhập/đăng ký
 *  5. UserDto             — thông tin user (không có password)
 *  6. UpdateProfileRequest— dữ liệu cập nhật hồ sơ
 *  7. UpdateUserStatusRequest — admin thay đổi trạng thái user
 *  8. AdminCreateUserRequest  — admin tạo tài khoản mới
 * ╚══════════════════════════════════════════════════════════╝
 */
public class AuthDto {

    // ─────────────────────────────────────────────────────────
    // 1. Dữ liệu nhận vào khi user đăng ký tài khoản mới
    // POST /api/auth/register
    // ─────────────────────────────────────────────────────────
    @Data // Tự sinh getter/setter/toString...
    public static class RegisterRequest {

        @NotBlank(message = "Họ tên không được trống") // Không cho phép null hoặc chuỗi rỗng
        @Size(min = 2, max = 100)                       // Độ dài tên từ 2 đến 100 ký tự
        private String fullName;

        @NotBlank(message = "Email không được trống")
        @Email(message = "Email không hợp lệ")          // Phải có định dạng abc@domain.com
        private String email;

        @NotBlank(message = "Mật khẩu không được trống")
        @Size(min = 6, message = "Mật khẩu phải ít nhất 6 ký tự") // Tối thiểu 6 ký tự
        private String password;

        // Regex kiểm tra số điện thoại VN: bắt đầu bằng 03x, 05x, 07x, 08x, 09x + 8 chữ số
        @Pattern(regexp = "^(0[3|5|7|8|9])+([0-9]{8})$", message = "Số điện thoại không hợp lệ")
        private String phone; // Có thể null nếu user chưa muốn điền
    }

    // ─────────────────────────────────────────────────────────
    // 2. Dữ liệu nhận vào khi user đăng nhập
    // POST /api/auth/login
    // ─────────────────────────────────────────────────────────
    @Data
    public static class LoginRequest {
        @NotBlank(message = "Email không được trống")
        @Email
        private String email;    // Email dùng làm username

        @NotBlank(message = "Mật khẩu không được trống")
        private String password; // Mật khẩu thuần (server sẽ so sánh với BCrypt hash trong DB)
    }

    // ─────────────────────────────────────────────────────────
    // 3. Dữ liệu nhận vào khi làm mới Access Token
    // POST /api/auth/refresh
    // ─────────────────────────────────────────────────────────
    @Data
    public static class RefreshRequest {
        @NotBlank
        private String refreshToken; // Refresh token (UUID) lấy từ lần đăng nhập trước
    }

    // ─────────────────────────────────────────────────────────
    // 4. Dữ liệu trả về sau khi đăng nhập / đăng ký thành công
    // ─────────────────────────────────────────────────────────
    @Data
    public static class AuthResponse {
        private Long id;           // ID user trong database
        private String fullName;   // Họ tên đầy đủ
        private String email;      // Email tài khoản
        private String phone;      // Số điện thoại
        private String role;       // Vai trò: "USER" hoặc "ADMIN"
        private String accessToken;  // JWT Access Token — dùng để gọi các API cần xác thực
        private String refreshToken; // Refresh Token (UUID) — dùng để lấy access token mới khi hết hạn
        private String tokenType = "Bearer"; // Loại token, luôn là "Bearer" (chuẩn OAuth2)
    }

    // ─────────────────────────────────────────────────────────
    // 5. Thông tin user trả về (không có password, token)
    //    Dùng cho GET /api/auth/me và GET /api/users/{id}
    // ─────────────────────────────────────────────────────────
    @Data
    public static class UserDto {
        private Long id;
        private String fullName;
        private String email;
        private String phone;
        private String role;      // "USER" hoặc "ADMIN"
        private String createdAt; // Thời gian tạo tài khoản (ISO format)
    }

    // ─────────────────────────────────────────────────────────
    // 6. Dữ liệu nhận vào khi user tự cập nhật hồ sơ
    // PUT /api/users/{id}
    // ─────────────────────────────────────────────────────────
    @Data
    public static class UpdateProfileRequest {
        @Size(min = 2, max = 100)
        private String fullName; // Có thể null nếu user không muốn đổi tên

        @Pattern(regexp = "^(0[3|5|7|8|9])+([0-9]{8})$")
        private String phone;   // Có thể null nếu user không muốn đổi số điện thoại
    }

    // ─────────────────────────────────────────────────────────
    // 7. Dữ liệu admin gửi lên để thay đổi trạng thái user
    // PUT /api/admin/users/{id}/status
    // ─────────────────────────────────────────────────────────
    @Data
    public static class UpdateUserStatusRequest {
        private String status; // "ACTIVE" = mở khóa, "BANNED" = khóa tài khoản
    }

    // ─────────────────────────────────────────────────────────
    // 8. Dữ liệu admin dùng khi tạo tài khoản mới cho người khác
    // POST /api/admin/users
    // ─────────────────────────────────────────────────────────
    @Data
    public static class AdminCreateUserRequest {
        @NotBlank(message = "Họ tên không được trống")
        @Size(min = 2, max = 100)
        private String fullName;

        @NotBlank(message = "Email không được trống")
        @Email(message = "Email không hợp lệ")
        private String email;

        @NotBlank(message = "Mật khẩu không được trống")
        @Size(min = 6, message = "Mật khẩu phải ít nhất 6 ký tự")
        private String password;

        @Pattern(regexp = "^(0[3|5|7|8|9])+([0-9]{8})$")
        private String phone;

        private String role = "USER";
    }

    // ─────────────────────────────────────────────────────────
    // 9. Quên mật khẩu — Gửi OTP về email
    // POST /api/auth/forgot-password
    // ─────────────────────────────────────────────────────────
    @Data
    public static class ForgotPasswordRequest {
        @NotBlank(message = "Email không được trống")
        @Email(message = "Email không hợp lệ")
        private String email;
    }

    // ─────────────────────────────────────────────────────────
    // 10. Xác minh OTP
    // POST /api/auth/verify-otp
    // ─────────────────────────────────────────────────────────
    @Data
    public static class VerifyOtpRequest {
        @NotBlank(message = "Email không được trống")
        @Email
        private String email;

        @NotBlank(message = "Mã OTP không được trống")
        @Size(min = 6, max = 6, message = "Mã OTP phải đúng 6 chữ số")
        private String code;
    }

    // ─────────────────────────────────────────────────────────
    // 11. Đặt lại mật khẩu sau khi xác minh OTP
    // POST /api/auth/reset-password
    // ─────────────────────────────────────────────────────────
    @Data
    public static class ResetPasswordRequest {
        @NotBlank(message = "Email không được trống")
        @Email
        private String email;

        @NotBlank(message = "Mã OTP không được trống")
        private String code;

        @NotBlank(message = "Mật khẩu mới không được trống")
        @Size(min = 6, message = "Mật khẩu phải ít nhất 6 ký tự")
        private String newPassword;
    }

    // ─────────────────────────────────────────────────────────
    // 12. Đăng ký — Gửi OTP xác minh email
    // POST /api/auth/register-send-otp
    // ─────────────────────────────────────────────────────────
    @Data
    public static class RegisterSendOtpRequest {
        @NotBlank(message = "Họ tên không được trống")
        @Size(min = 2, max = 100)
        private String fullName;

        @NotBlank(message = "Email không được trống")
        @Email(message = "Email không hợp lệ")
        private String email;

        @NotBlank(message = "Mật khẩu không được trống")
        @Size(min = 6, message = "Mật khẩu phải ít nhất 6 ký tự")
        private String password;

        @Pattern(regexp = "^(0[3|5|7|8|9])+([0-9]{8})$", message = "Số điện thoại không hợp lệ")
        private String phone;
    }

    // ─────────────────────────────────────────────────────────
    // 13. Đăng ký — Xác minh OTP + tạo tài khoản
    // POST /api/auth/register-verify
    // ─────────────────────────────────────────────────────────
    @Data
    public static class RegisterVerifyRequest {
        @NotBlank(message = "Email không được trống")
        @Email
        private String email;

        @NotBlank(message = "Mã OTP không được trống")
        @Size(min = 6, max = 6, message = "Mã OTP phải đúng 6 chữ số")
        private String code;
    }

    // ─────────────────────────────────────────────────────────
    // 14. Đổi mật khẩu (đăng nhập rồi)
    // POST /api/auth/change-password
    // ─────────────────────────────────────────────────────────
    @Data
    public static class ChangePasswordRequest {
        @NotBlank(message = "Mật khẩu cũ không được trống")
        private String oldPassword;

        @NotBlank(message = "Mật khẩu mới không được trống")
        @Size(min = 6, message = "Mật khẩu phải ít nhất 6 ký tự")
        private String newPassword;
    }
}

