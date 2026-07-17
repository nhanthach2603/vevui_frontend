package com.vevui.userservice.controller; // Package chứa các Controller — tầng nhận và trả HTTP request

import com.vevui.userservice.dto.AuthDto;
import com.vevui.userservice.service.UserService;
import jakarta.validation.Valid;          // Kích hoạt validation các field trong @RequestBody
import lombok.RequiredArgsConstructor;    // Lombok: sinh constructor inject field final
import lombok.extern.slf4j.Slf4j;        // Logging
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest; // Tạo đối tượng phân trang từ page number + size
import org.springframework.http.HttpStatus;         // Các HTTP status code (200, 201, 400...)
import org.springframework.http.ResponseEntity;     // Bao bọc response + HTTP status
import org.springframework.web.bind.annotation.*;   // @RestController, @GetMapping, @PostMapping...

import java.util.List;
import java.util.Map;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  AuthController — Tầng tiếp nhận HTTP request cho User Service
 *
 *  Controller chỉ có nhiệm vụ:
 *  1. Nhận request từ client (qua API Gateway)
 *  2. Validate dữ liệu đầu vào (@Valid)
 *  3. Gọi UserService để xử lý business logic
 *  4. Trả về ResponseEntity với đúng HTTP status code
 *
 *  Controller KHÔNG chứa logic nghiệp vụ (không tự truy vấn DB,
 *  không tự tính toán — tất cả nhờ UserService).
 * ╚══════════════════════════════════════════════════════════╝
 */
@Slf4j
@RestController       // = @Controller + @ResponseBody: tự động serialize return value thành JSON
@RequiredArgsConstructor // Inject UserService qua constructor
public class AuthController {

    private final UserService userService; // Inject UserService để gọi các chức năng nghiệp vụ

    // ══════════════════════════════════════════════════════════
    // ── AUTH ENDPOINTS — Xác thực người dùng ──
    // Không yêu cầu token (permitAll trong SecurityConfig)
    // ══════════════════════════════════════════════════════════

    /**
     * Đăng ký tài khoản mới
     * POST /api/auth/register
     * Body: { fullName, email, password, phone }
     * Response: 201 Created + AuthResponse (user info + tokens)
     */
    @PostMapping("/api/auth/register")
    public ResponseEntity<AuthDto.AuthResponse> register(
            @Valid @RequestBody AuthDto.RegisterRequest request) {
            // @Valid     : kích hoạt kiểm tra các annotation @NotBlank, @Email, @Size... trong DTO
            // @RequestBody: đọc JSON từ body của HTTP request và chuyển thành Java object
        log.info("Register request for: {}", request.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED) // HTTP 201 Created (đã tạo tài nguyên mới)
                .body(userService.register(request));
    }

    /**
     * Đăng nhập — lấy access token + refresh token
     * POST /api/auth/login
     * Body: { email, password }
     * Response: 200 OK + AuthResponse (user info + tokens)
     */
    @PostMapping("/api/auth/login")
    public ResponseEntity<AuthDto.AuthResponse> login(
            @Valid @RequestBody AuthDto.LoginRequest request) {
        log.info("Login request for: {}", request.getEmail());
        return ResponseEntity.ok(userService.login(request)); // HTTP 200 OK
    }

    /**
     * Làm mới Access Token khi đã hết hạn (dùng Refresh Token)
     * POST /api/auth/refresh
     * Body: { refreshToken: "uuid-string" }
     * Response: 200 OK + AuthResponse với access token mới
     */
    @PostMapping("/api/auth/refresh")
    public ResponseEntity<AuthDto.AuthResponse> refresh(
            @Valid @RequestBody AuthDto.RefreshRequest request) {
        return ResponseEntity.ok(userService.refreshToken(request.getRefreshToken()));
    }

    // ══════════════════════════════════════════════════════════
    // ── FORGOT PASSWORD — Quên mật khẩu ──
    // ══════════════════════════════════════════════════════════

    @PostMapping("/api/auth/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody AuthDto.ForgotPasswordRequest request) {
        userService.forgotPassword(request);
        return ResponseEntity.ok(Map.of("message", "Mã xác minh đã được gửi về email"));
    }

    @PostMapping("/api/auth/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(
            @Valid @RequestBody AuthDto.VerifyOtpRequest request) {
        userService.verifyOtp(request);
        return ResponseEntity.ok(Map.of("message", "Xác minh OTP thành công"));
    }

    @PostMapping("/api/auth/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody AuthDto.ResetPasswordRequest request) {
        userService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Đặt lại mật khẩu thành công"));
    }

    /**
     * Đổi mật khẩu (đã đăng nhập)
     * POST /api/auth/change-password
     * Header: X-User-Id (do API Gateway truyền)
     * Body: { oldPassword, newPassword }
     */
    @PostMapping("/api/auth/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody AuthDto.ChangePasswordRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        userService.changePassword(userId, request);
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }

    // ══════════════════════════════════════════════════════════
    // ── REGISTER OTP — Đăng ký xác minh email ──
    // ══════════════════════════════════════════════════════════

    @PostMapping("/api/auth/register-send-otp")
    public ResponseEntity<Map<String, String>> registerSendOtp(
            @Valid @RequestBody AuthDto.RegisterSendOtpRequest request) {
        userService.registerSendOtp(request);
        return ResponseEntity.ok(Map.of("message", "Mã xác minh đã được gửi về email"));
    }

    @PostMapping("/api/auth/register-verify")
    public ResponseEntity<AuthDto.AuthResponse> registerVerify(
            @Valid @RequestBody AuthDto.RegisterVerifyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userService.registerVerify(request));
    }

    /**
     * Lấy thông tin user hiện đang đăng nhập
     * GET /api/auth/me
     * Header: X-User-Id (do API Gateway trích xuất từ JWT và truyền vào)
     * Response: 200 OK + UserDto
     */
    @GetMapping("/api/auth/me")
    public ResponseEntity<AuthDto.UserDto> getCurrentUser(
            @RequestHeader("X-User-Id") Long userId) {
            // @RequestHeader: đọc giá trị từ HTTP header
            // X-User-Id được API Gateway tự động thêm vào sau khi xác thực JWT
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    // ══════════════════════════════════════════════════════════
    // ── USER ENDPOINTS — Người dùng quản lý hồ sơ của mình ──
    // ══════════════════════════════════════════════════════════

    /**
     * Lấy thông tin user theo ID
     * GET /api/users/{id}
     * Response: 200 OK + UserDto
     */
    @GetMapping("/api/users/{id}")
    public ResponseEntity<AuthDto.UserDto> getUserById(
            @PathVariable Long id) {
            // @PathVariable: lấy giá trị {id} từ URL path
        return ResponseEntity.ok(userService.getUserById(id));
    }

    /**
     * Cập nhật hồ sơ cá nhân (tên, số điện thoại)
     * PUT /api/users/{id}
     * Header: X-User-Id (để biết ai đang sửa)
     * Body: { fullName?, phone? }
     * Response: 200 OK + UserDto đã cập nhật
     */
    @PutMapping("/api/users/{id}")
    public ResponseEntity<AuthDto.UserDto> updateProfile(
            @PathVariable Long id,
            @Valid @RequestBody AuthDto.UpdateProfileRequest request,
            @RequestHeader("X-User-Id") String requesterId) {
            // requesterId: ID của người đang gọi API — trong production nên kiểm tra
            //              requesterId == id để tránh sửa hồ sơ của người khác
        return ResponseEntity.ok(userService.updateProfile(id, request));
    }

    // ══════════════════════════════════════════════════════════
    // ── ADMIN ENDPOINTS — Quản trị viên quản lý toàn bộ user ──
    // Chỉ được gọi nếu user có role ADMIN (kiểm tra ở API Gateway)
    // ══════════════════════════════════════════════════════════

    /**
     * Lấy danh sách toàn bộ user có phân trang
     * GET /api/admin/users?page=0&size=20
     * Response: 200 OK + Page<UserDto>
     */
    @GetMapping("/api/admin/users")
    public ResponseEntity<Page<AuthDto.UserDto>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,   // Số trang, mặc định = trang đầu tiên
            @RequestParam(defaultValue = "20") int size) { // Số bản ghi mỗi trang, mặc định = 20
        return ResponseEntity.ok(userService.getAllUsers(PageRequest.of(page, size)));
        // PageRequest.of(page, size): tạo đối tượng Pageable chứa thông tin phân trang
    }

    /**
     * Tìm kiếm user theo từ khóa (tên, email, điện thoại)
     * GET /api/admin/users/search?q=nguyen
     * Response: 200 OK + List<UserDto>
     */
    @GetMapping("/api/admin/users/search")
    public ResponseEntity<List<AuthDto.UserDto>> searchUsers(
            @RequestParam String q) { // @RequestParam: lấy query parameter ?q=... từ URL
        return ResponseEntity.ok(userService.searchUsers(q));
    }

    /**
     * Admin tạo tài khoản mới (có thể tạo tài khoản ADMIN)
     * POST /api/admin/users
     * Body: { fullName, email, password, phone, role }
     * Response: 201 Created + UserDto
     */
    @PostMapping("/api/admin/users")
    public ResponseEntity<AuthDto.UserDto> createUserByAdmin(
            @Valid @RequestBody AuthDto.AdminCreateUserRequest request) {
        log.info("Admin creating user: {}", request.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userService.createUserByAdmin(request));
    }

    /**
     * Admin xem chi tiết 1 user
     * GET /api/admin/users/{id}
     */
    @GetMapping("/api/admin/users/{id}")
    public ResponseEntity<AuthDto.UserDto> getUserByIdAdmin(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    /**
     * Admin khóa / mở khóa tài khoản user
     * PUT /api/admin/users/{id}/status
     * Body: { "status": "BANNED" } hoặc { "status": "ACTIVE" }
     */
    @PutMapping("/api/admin/users/{id}/status")
    public ResponseEntity<AuthDto.UserDto> updateUserStatus(
            @PathVariable Long id,
            @RequestBody AuthDto.UpdateUserStatusRequest req) {
        return ResponseEntity.ok(userService.updateUserStatus(id, req.getStatus()));
    }

    /**
     * Admin thay đổi vai trò (role) của user
     * PUT /api/admin/users/{id}/role
     * Body: { "role": "ADMIN" }
     */
    @PutMapping("/api/admin/users/{id}/role")
    public ResponseEntity<AuthDto.UserDto> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
            // Map<String, String>: nhận JSON object đơn giản {"role": "ADMIN"}
            //                      linh hoạt hơn là tạo riêng 1 DTO class
        return ResponseEntity.ok(userService.updateUserRole(id, body.get("role")));
    }

    /**
     * Admin xóa mềm (vô hiệu hóa) tài khoản user
     * DELETE /api/admin/users/{id}
     * Response: 200 OK + { "message": "Tài khoản đã được vô hiệu hóa" }
     */
    @DeleteMapping("/api/admin/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        // Map.of(): tạo immutable map chỉ đọc — tiện để trả về thông báo đơn giản
        return ResponseEntity.ok(Map.of("message", "Tài khoản đã được vô hiệu hóa"));
    }

    // ══════════════════════════════════════════════════════════
    // ── GLOBAL ERROR HANDLER ──
    // ══════════════════════════════════════════════════════════

    /**
     * Bắt tất cả lỗi IllegalArgumentException được ném từ UserService
     * → Trả về HTTP 400 Bad Request thay vì 500 Internal Server Error
     *
     * Ví dụ: "Email đã được sử dụng", "Refresh token không hợp lệ"...
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest() // HTTP 400 Bad Request
                .body(Map.of("error", ex.getMessage())); // { "error": "nội dung lỗi" }
    }
}
