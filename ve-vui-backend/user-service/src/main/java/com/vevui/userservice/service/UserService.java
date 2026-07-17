package com.vevui.userservice.service; // Package chứa các Service — tầng xử lý business logic

import com.vevui.userservice.dto.AuthDto;
import com.vevui.userservice.entity.User;
import com.vevui.userservice.repository.OtpRepository;
import com.vevui.userservice.repository.UserRepository;
import com.vevui.userservice.security.JwtService;
import lombok.RequiredArgsConstructor; // Lombok: sinh constructor inject tất cả field final
import lombok.extern.slf4j.Slf4j;    // Logging với SLF4J
import org.springframework.data.domain.Page;     // Trả về kết quả phân trang
import org.springframework.data.domain.Pageable; // Chứa thông tin trang (số trang, kích thước)
import org.springframework.security.crypto.password.PasswordEncoder; // Mã hóa/so sánh mật khẩu
import org.springframework.stereotype.Service;   // Đánh dấu là Spring Bean kiểu Service
import org.springframework.transaction.annotation.Transactional; // Bọc method trong database transaction

import java.time.format.DateTimeFormatter; // Format thời gian sang chuỗi
import java.util.List;
import java.util.stream.Collectors;        // Dùng trong stream để collect kết quả

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  UserService — Tầng xử lý nghiệp vụ (Business Logic) cho User
 *
 *  Các chức năng chính:
 *  1. Đăng ký tài khoản (register)
 *  2. Đăng nhập (login)
 *  3. Làm mới token (refreshToken)
 *  4. Xem / cập nhật hồ sơ (getUserById, updateProfile)
 *  5. Quản lý user — dành cho Admin (getAllUsers, searchUsers,
 *     createUserByAdmin, updateUserStatus, updateUserRole, deleteUser)
 *
 *  Tầng Service KHÔNG được phép:
 *  - Biết về HTTP (không import HttpServletRequest, ResponseEntity...)
 *  - Truy cập DB trực tiếp (phải qua Repository)
 * ╚══════════════════════════════════════════════════════════╝
 */
@Slf4j            // Tự sinh logger: log.info(), log.warn(), log.error()...
@Service          // Đăng ký class này là Spring Bean — Spring sẽ tự inject khi cần
@RequiredArgsConstructor // Sinh constructor inject: userRepository, passwordEncoder, jwtService
public class UserService {

    // Spring inject tự động qua constructor (do @RequiredArgsConstructor)
    private final UserRepository userRepository;   // Truy cập bảng users trong DB
    private final PasswordEncoder passwordEncoder; // Mã hóa / kiểm tra mật khẩu BCrypt
    private final JwtService jwtService;           // Tạo / xác thực JWT token
    private final OtpRepository otpRepository;      // Truy cập bảng otps
    private final EmailService emailService;        // Gửi email OTP

    // ═══════════════════════════════════════════════════════
    // 1. ĐĂNG KÝ TÀI KHOẢN
    // POST /api/auth/register
    // ═══════════════════════════════════════════════════════

    @Transactional // Mọi thao tác DB trong method này nằm trong cùng 1 transaction
                   // Nếu có lỗi xảy ra → tự động rollback toàn bộ
    public AuthDto.AuthResponse register(AuthDto.RegisterRequest request) {
        // Kiểm tra email đã tồn tại chưa — tránh trùng lặp
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email đã được sử dụng: " + request.getEmail());
        }
        // Kiểm tra số điện thoại nếu user có điền
        if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Số điện thoại đã được sử dụng");
        }

        // Tạo đối tượng User mới với Builder pattern
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword())) // Mã hóa password trước khi lưu!
                .phone(request.getPhone())
                .role(User.Role.USER) // Mặc định user thường khi tự đăng ký
                .build();

        // Tạo refresh token và gán vào user trước khi save
        String refreshToken = jwtService.generateRefreshToken();
        user.setRefreshToken(refreshToken);

        // Lưu user vào database
        User saved = userRepository.save(user);
        log.info("New user registered: {} ({})", saved.getEmail(), saved.getId());

        // Trả về AuthResponse chứa thông tin user + cả 2 token
        return buildAuthResponse(saved, refreshToken);
    }

    // ═══════════════════════════════════════════════════════
    // 2. ĐĂNG NHẬP
    // POST /api/auth/login
    // ═══════════════════════════════════════════════════════

    @Transactional
    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        // Tìm user theo email — nếu không tìm thấy → báo lỗi chung chung (bảo mật)
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Email hoặc mật khẩu không đúng"));
                // Dùng thông báo chung để tránh lộ thông tin: "email không tồn tại"

        // Kiểm tra tài khoản có bị khóa không
        if (!user.getEnabled()) {
            throw new IllegalArgumentException("Tài khoản đã bị khóa");
        }

        // So sánh mật khẩu: passwordEncoder.matches(rawPassword, encodedPassword)
        // Hàm này tự động xử lý salt trong BCrypt hash
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Email hoặc mật khẩu không đúng"); // Thông báo chung cho cả 2 trường hợp
        }

        // Tạo refresh token mới mỗi lần đăng nhập (rotation strategy — an toàn hơn)
        String refreshToken = jwtService.generateRefreshToken();
        user.setRefreshToken(refreshToken);
        userRepository.save(user); // Cập nhật refresh token mới vào DB

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user, refreshToken);
    }

    // ═══════════════════════════════════════════════════════
    // 3. LÀM MỚI TOKEN
    // POST /api/auth/refresh
    // ═══════════════════════════════════════════════════════

    @Transactional
    public AuthDto.AuthResponse refreshToken(String refreshToken) {
        // Tìm user sở hữu refresh token này trong DB
        User user = userRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new IllegalArgumentException("Refresh token không hợp lệ hoặc đã hết hạn"));

        // Token rotation: sinh refresh token mới, vô hiệu hóa token cũ
        // Nếu kẻ tấn công dùng refresh token bị đánh cắp → token đó đã bị thay thế
        String newRefreshToken = jwtService.generateRefreshToken();
        user.setRefreshToken(newRefreshToken);
        userRepository.save(user);

        return buildAuthResponse(user, newRefreshToken);
    }

    // ═══════════════════════════════════════════════════════
    // 4. XEM THÔNG TIN USER
    // GET /api/auth/me  hoặc  GET /api/users/{id}
    // ═══════════════════════════════════════════════════════

    public AuthDto.UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user: " + id));
        return toUserDto(user); // Chuyển sang DTO (không trả password, token ra ngoài)
    }

    // ═══════════════════════════════════════════════════════
    // 5. CẬP NHẬT HỒ SƠ
    // PUT /api/users/{id}
    // ═══════════════════════════════════════════════════════

    @Transactional
    public AuthDto.UserDto updateProfile(Long id, AuthDto.UpdateProfileRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user: " + id));

        // Chỉ cập nhật các field được gửi lên (partial update)
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) {
            // Kiểm tra số điện thoại mới có trùng với người khác không
            // (trừ chính user đang sửa — user.getPhone() là số hiện tại của họ)
            if (userRepository.existsByPhone(request.getPhone()) &&
                    !request.getPhone().equals(user.getPhone())) {
                throw new IllegalArgumentException("Số điện thoại đã được sử dụng");
            }
            user.setPhone(request.getPhone());
        }

        return toUserDto(userRepository.save(user));
    }

    // ═══════════════════════════════════════════════════════
    // 6. LẤY DANH SÁCH TẤT CẢ USER (ADMIN)
    // GET /api/admin/users?page=0&size=20
    // ═══════════════════════════════════════════════════════

    public Page<AuthDto.UserDto> getAllUsers(Pageable pageable) {
        // findAll(pageable): truy vấn có phân trang — tránh load toàn bộ dữ liệu vào RAM
        // .map(this::toUserDto): chuyển mỗi User entity thành UserDto
        return userRepository.findAll(pageable).map(this::toUserDto);
    }

    // ═══════════════════════════════════════════════════════
    // ── ADMIN: Quản lý tài khoản người dùng ──
    // ═══════════════════════════════════════════════════════

    /**
     * Admin thay đổi trạng thái tài khoản (khóa / mở khóa)
     * PUT /api/admin/users/{id}/status
     * Body: { "status": "BANNED" } hoặc { "status": "ACTIVE" }
     */
    @Transactional
    public AuthDto.UserDto updateUserStatus(Long id, String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user: " + id));
        if ("BANNED".equals(status)) {
            user.setEnabled(false); // Khóa tài khoản: user không thể đăng nhập
        } else if ("ACTIVE".equals(status)) {
            user.setEnabled(true);  // Mở khóa tài khoản
        } else {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + status);
        }
        return toUserDto(userRepository.save(user));
    }

    /**
     * Admin xóa mềm (soft delete) tài khoản — KHÔNG xóa thật khỏi DB
     * DELETE /api/admin/users/{id}
     *
     * Soft delete: chỉ set enabled = false
     * → Giữ lại lịch sử đặt vé, không bị mất dữ liệu liên quan
     */
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user: " + id));
        user.setEnabled(false); // Vô hiệu hóa thay vì xóa thật
        userRepository.save(user);
        log.info("User {} soft-deleted (disabled)", id);
    }

    /**
     * Admin tìm kiếm user theo từ khóa
     * GET /api/admin/users/search?q=nguyen
     */
    public List<AuthDto.UserDto> searchUsers(String q) {
        // Chuyển từ khóa sang chữ thường trước khi tìm (LOWER() trong query cũng làm vậy)
        return userRepository.searchByKeyword(q.toLowerCase()).stream()
                .map(this::toUserDto)     // Chuyển mỗi User → UserDto
                .collect(Collectors.toList());
    }

    /**
     * Admin tạo tài khoản mới (có thể tạo cả tài khoản ADMIN)
     * POST /api/admin/users
     */
    @Transactional
    public AuthDto.UserDto createUserByAdmin(AuthDto.AdminCreateUserRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email đã được sử dụng: " + req.getEmail());
        }
        if (req.getPhone() != null && userRepository.existsByPhone(req.getPhone())) {
            throw new IllegalArgumentException("Số điện thoại đã được sử dụng");
        }

        // Parse role từ String → Enum, bắt lỗi nếu role không hợp lệ
        User.Role role = User.Role.USER; // Mặc định USER
        if (req.getRole() != null) {
            try {
                role = User.Role.valueOf(req.getRole().toUpperCase()); // "admin" → "ADMIN" → User.Role.ADMIN
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Vai trò không hợp lệ: " + req.getRole());
            }
        }

        User user = User.builder()
                .fullName(req.getFullName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword())) // Mã hóa password
                .phone(req.getPhone())
                .role(role)
                .build();

        User saved = userRepository.save(user);
        log.info("Admin created user: {} ({})", saved.getEmail(), saved.getId());
        return toUserDto(saved);
    }

    /**
     * Admin thay đổi role của user (USER ↔ ADMIN)
     * PUT /api/admin/users/{id}/role
     * Body: { "role": "ADMIN" }
     */
    @Transactional
    public AuthDto.UserDto updateUserRole(Long id, String role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user: " + id));
        try {
            user.setRole(User.Role.valueOf(role.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Vai trò không hợp lệ: " + role);
        }
        return toUserDto(userRepository.save(user));
    }

    // ═══════════════════════════════════════════════════════
    // ── PRIVATE HELPER METHODS ──
    // ═══════════════════════════════════════════════════════

    /**
     * Tạo AuthResponse đầy đủ sau khi đăng nhập / đăng ký thành công
     * Bao gồm: thông tin user + access token + refresh token
     */
    private AuthDto.AuthResponse buildAuthResponse(User user, String refreshToken) {
        AuthDto.AuthResponse response = new AuthDto.AuthResponse();
        response.setId(user.getId());
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setRole(user.getRole().name());                     // Enum → String: "USER" hoặc "ADMIN"
        response.setAccessToken(jwtService.generateAccessToken(user)); // Tạo JWT mới
        response.setRefreshToken(refreshToken);                       // Refresh token đã được lưu vào DB
        return response;
    }

    // ════════════════════════════════════════════════════════
    // 8. FORGOT PASSWORD — Quên mật khẩu
    // ════════════════════════════════════════════════════════

    /**
     * Gửi OTP đặt lại mật khẩu
     * 1. Kiểm tra email tồn tại trong DB
     * 2. Tạo mã OTP 6 chữ số ngẫu nhiên
     * 3. Lưu OTP vào bảng otps (hết hạn sau 5 phút)
     * 4. Gửi email chứa OTP qua Gmail SMTP
     */
    @Transactional
    public void forgotPassword(AuthDto.ForgotPasswordRequest req) {
        if (!userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email không tồn tại trong hệ thống");
        }

        String code = String.format("%06d", (int) (Math.random() * 1000000));

        otpRepository.deleteAllByEmailAndPurpose(req.getEmail(), "forgot-password");

        com.vevui.userservice.entity.Otp otp = com.vevui.userservice.entity.Otp.builder()
                .email(req.getEmail())
                .code(code)
                .expiresAt(java.time.LocalDateTime.now().plusMinutes(5))
                .used(false)
                .purpose("forgot-password")
                .build();
        otpRepository.save(otp);

        emailService.sendOtpEmail(req.getEmail(), code);
        log.info("OTP sent to {}", req.getEmail());
    }

    /**
     * Xác minh OTP
     * Kiểm tra: OTP tồn tại, chưa dùng, chưa hết hạn
     */
    public void verifyOtp(AuthDto.VerifyOtpRequest req) {
        com.vevui.userservice.entity.Otp otp = otpRepository
                .findTopByEmailAndPurposeOrderByCreatedAtDesc(req.getEmail(), "forgot-password")
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mã OTP"));

        if (otp.getUsed()) {
            throw new IllegalArgumentException("Mã OTP đã được sử dụng");
        }
        if (java.time.LocalDateTime.now().isAfter(otp.getExpiresAt())) {
            throw new IllegalArgumentException("Mã OTP đã hết hạn");
        }
        if (!otp.getCode().equals(req.getCode())) {
            throw new IllegalArgumentException("Mã OTP không chính xác");
        }
    }

    /**
     * Đặt lại mật khẩu
     * 1. Xác minh OTP
     * 2. Cập nhật mật khẩu mới (BCrypt hash)
     * 3. Đánh dấu OTP đã dùng
     */
    @Transactional
    public void resetPassword(AuthDto.ResetPasswordRequest req) {
        com.vevui.userservice.entity.Otp otp = otpRepository
                .findTopByEmailAndPurposeOrderByCreatedAtDesc(req.getEmail(), "forgot-password")
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mã OTP"));

        if (otp.getUsed()) {
            throw new IllegalArgumentException("Mã OTP đã được sử dụng");
        }
        if (java.time.LocalDateTime.now().isAfter(otp.getExpiresAt())) {
            throw new IllegalArgumentException("Mã OTP đã hết hạn");
        }
        if (!otp.getCode().equals(req.getCode())) {
            throw new IllegalArgumentException("Mã OTP không chính xác");
        }

        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản"));
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);

        otp.setUsed(true);
        otpRepository.save(otp);

        log.info("Password reset for {}", req.getEmail());
    }

    // ════════════════════════════════════════════════════════
    // 8b. ĐỔI MẬT KHẨU (đã đăng nhập)
    // POST /api/auth/change-password
    // ════════════════════════════════════════════════════════

    @Transactional
    public void changePassword(Long userId, AuthDto.ChangePasswordRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản"));

        if (!passwordEncoder.matches(req.getOldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu cũ không chính xác");
        }

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed for user {}", userId);
    }

    // ════════════════════════════════════════════════════════
    // 9. REGISTER WITH OTP — Đăng ký xác minh email
    // ════════════════════════════════════════════════════════

    /**
     * Đăng ký — Bước 1: Gửi OTP xác minh email
     * 1. Kiểm tra email chưa tồn tại
     * 2. Lưu thông tin đăng ký tạm vào OTP (password đã hash)
     * 3. Gửi OTP về email
     */
    @Transactional
    public void registerSendOtp(AuthDto.RegisterSendOtpRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email đã được sử dụng");
        }

        String code = String.format("%06d", (int) (Math.random() * 1000000));

        otpRepository.deleteAllByEmailAndPurpose(req.getEmail(), "register");

        com.vevui.userservice.entity.Otp otp = com.vevui.userservice.entity.Otp.builder()
                .email(req.getEmail())
                .code(code)
                .expiresAt(java.time.LocalDateTime.now().plusMinutes(5))
                .used(false)
                .purpose("register")
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .build();
        otpRepository.save(otp);

        emailService.sendOtpEmail(req.getEmail(), code);
        log.info("Register OTP sent to {}", req.getEmail());
    }

    /**
     * Đăng ký — Bước 2: Xác minh OTP + tạo tài khoản
     * 1. Verify OTP
     * 2. Tạo User mới từ dữ liệu tạm trong OTP
     * 3. Trả về AuthResponse (tokens)
     */
    @Transactional
    public AuthDto.AuthResponse registerVerify(AuthDto.RegisterVerifyRequest req) {
        com.vevui.userservice.entity.Otp otp = otpRepository
                .findTopByEmailAndPurposeOrderByCreatedAtDesc(req.getEmail(), "register")
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mã OTP đăng ký"));

        if (otp.getUsed()) {
            throw new IllegalArgumentException("Mã OTP đã được sử dụng");
        }
        if (java.time.LocalDateTime.now().isAfter(otp.getExpiresAt())) {
            throw new IllegalArgumentException("Mã OTP đã hết hạn");
        }
        if (!otp.getCode().equals(req.getCode())) {
            throw new IllegalArgumentException("Mã OTP không chính xác");
        }

        if (otp.getFullName() == null || otp.getPasswordHash() == null) {
            throw new IllegalArgumentException("Dữ liệu đăng ký không hợp lệ");
        }

        User user = User.builder()
                .fullName(otp.getFullName())
                .email(otp.getEmail())
                .password(otp.getPasswordHash())
                .phone(otp.getPhone())
                .role(User.Role.USER)
                .enabled(true)
                .build();
        User saved = userRepository.save(user);

        otp.setUsed(true);
        otpRepository.save(otp);

        String refreshToken = jwtService.generateRefreshToken();
        saved.setRefreshToken(refreshToken);
        userRepository.save(saved);

        log.info("User registered via OTP: {}", saved.getEmail());

        AuthDto.AuthResponse response = new AuthDto.AuthResponse();
        response.setId(saved.getId());
        response.setFullName(saved.getFullName());
        response.setEmail(saved.getEmail());
        response.setPhone(saved.getPhone());
        response.setRole(saved.getRole().name());
        response.setAccessToken(jwtService.generateAccessToken(saved));
        response.setRefreshToken(refreshToken);
        return response;
    }

    /**
     * Chuyển User entity → UserDto (loại bỏ password, token nhạy cảm)
     * Dùng khi trả thông tin user cho frontend mà không cần token
     */
    private AuthDto.UserDto toUserDto(User user) {
        AuthDto.UserDto dto = new AuthDto.UserDto();
        dto.setId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setRole(user.getRole().name()); // Enum → String
        if (user.getCreatedAt() != null) {
            // Format thời gian theo chuẩn ISO 8601: "2024-07-09T08:00:00"
            dto.setCreatedAt(user.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }
        return dto;
    }
}
