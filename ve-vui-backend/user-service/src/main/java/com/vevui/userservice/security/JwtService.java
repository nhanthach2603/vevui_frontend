package com.vevui.userservice.security; // Package chứa các class liên quan đến bảo mật

import com.vevui.userservice.entity.User;
import io.jsonwebtoken.Claims;                      // Đại diện cho "payload" bên trong JWT (các thông tin được lưu)
import io.jsonwebtoken.Jwts;                        // Thư viện JJWT: tạo và đọc JWT token
import io.jsonwebtoken.security.Keys;               // Sinh khóa mã hóa từ chuỗi secret
import lombok.extern.slf4j.Slf4j;                  // Logging (ghi log)
import org.springframework.beans.factory.annotation.Value; // Đọc giá trị từ application.yml
import org.springframework.stereotype.Service;      // Đánh dấu là Spring Bean kiểu Service

import java.nio.charset.StandardCharsets; // Mã hóa chuỗi sang bytes theo chuẩn UTF-8
import java.util.Date;                    // Dùng cho thời gian hết hạn token
import java.util.HashMap;                 // Map lưu các claim (thông tin) trong JWT
import java.util.Map;
import java.util.UUID;                    // Sinh chuỗi ngẫu nhiên cho refresh token

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  JwtService — Dịch vụ xử lý JSON Web Token (JWT)
 *
 *  JWT có cấu trúc 3 phần: Header.Payload.Signature
 *  - Header   : thuật toán mã hóa (HS256)
 *  - Payload  : dữ liệu (userId, email, role, expiry)
 *  - Signature: chữ ký số — tạo bằng secret key để chống giả mạo
 *
 *  Flow xác thực:
 *  1. User đăng nhập → server tạo accessToken + refreshToken
 *  2. Client gửi accessToken trong header "Authorization: Bearer <token>"
 *  3. API Gateway kiểm tra token bằng cùng secret key
 *  4. Khi accessToken hết hạn → dùng refreshToken để lấy token mới
 * ╚══════════════════════════════════════════════════════════╝
 */
@Slf4j
@Service
public class JwtService {

    // Đọc secret key từ application.yml (jwt.secret)
    // Dùng để ký và xác thực token — phải giữ bí mật tuyệt đối
    @Value("${jwt.secret}")
    private String secret;

    // Thời gian sống của access token: mặc định 86400000ms = 24 giờ
    // Đọc từ application.yml: jwt.access-token-expiration
    @Value("${jwt.access-token-expiration:86400000}")
    private long accessTokenExpiration;

    // Thời gian sống của refresh token: mặc định 604800000ms = 7 ngày
    // Đọc từ application.yml: jwt.refresh-token-expiration
    @Value("${jwt.refresh-token-expiration:604800000}")
    private long refreshTokenExpiration;

    /**
     * Tạo Access Token JWT cho user đã đăng nhập
     *
     * Token sẽ chứa các thông tin (claims):
     * - subject : userId (làm định danh chính)
     * - email   : email của user
     * - role    : vai trò (USER/ADMIN)
     * - fullName: tên đầy đủ
     * - iat     : thời điểm phát hành (issued at)
     * - exp     : thời điểm hết hạn (expiration)
     */
    public String generateAccessToken(User user) {
        // Khởi tạo map chứa các claims bổ sung (ngoài subject)
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", user.getEmail());       // Lưu email vào payload
        claims.put("role", user.getRole().name());   // Lưu role dạng String: "USER" hoặc "ADMIN"
        claims.put("fullName", user.getFullName());  // Lưu tên để frontend dùng trực tiếp

        return Jwts.builder()
                .claims(claims)                      // Thêm các claims tùy chỉnh vào payload
                .subject(user.getId().toString())    // Subject = userId (định danh chính của token)
                .issuedAt(new Date())                // Thời điểm tạo token = hiện tại
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiration)) // Thời hạn = hiện tại + 24h
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))   // Ký token bằng HMAC-SHA256
                .compact();                          // Tạo chuỗi JWT dạng "xxx.yyy.zzz"
    }

    /**
     * Tạo Refresh Token — là một UUID ngẫu nhiên (không phải JWT)
     *
     * Refresh token được lưu vào cột refresh_token trong bảng users.
     * Khi user gửi refresh token hợp lệ → server cấp access token mới.
     * UUID đảm bảo tính ngẫu nhiên cao, khó đoán.
     */
    public String generateRefreshToken() {
        return UUID.randomUUID().toString(); // Ví dụ: "550e8400-e29b-41d4-a716-446655440000"
    }

    /**
     * Giải mã và xác thực JWT, lấy toàn bộ claims trong payload
     *
     * Nếu token bị giả mạo hoặc hết hạn → ném Exception
     */
    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8))) // Dùng cùng secret để xác thực chữ ký
                .build()
                .parseSignedClaims(token)  // Phân tích và xác thực token
                .getPayload();             // Lấy phần payload (chứa các claims)
    }

    /**
     * Lấy userId từ JWT (trường "subject")
     * API Gateway dùng để truyền userId vào header "X-User-Id" khi forward request
     */
    public String extractUserId(String token) {
        return extractAllClaims(token).getSubject(); // Subject chính là userId đã set lúc tạo token
    }

    /**
     * Kiểm tra token có còn hợp lệ không
     *
     * Token hợp lệ khi:
     * 1. Chữ ký đúng (không bị giả mạo)
     * 2. Chưa hết hạn (expiration > now)
     *
     * @return true nếu hợp lệ, false nếu hết hạn hoặc không hợp lệ
     */
    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            // So sánh thời gian hết hạn với thời điểm hiện tại
            return !claims.getExpiration().before(new Date());
        } catch (Exception e) {
            // Token bị giả mạo, sai format, hoặc secret key khác → log warning
            log.warn("JWT validation error: {}", e.getMessage());
            return false;
        }
    }
}

