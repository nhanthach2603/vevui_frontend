package com.vevui.gateway.filter; // Package chứa filters của Gateway

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  JwtAuthFilter — Bộ lọc xác thực JWT cho mọi request
 *
 *  Đây là "lính gác cửa" của toàn bộ hệ thống microservice.
 *  Mọi request đi qua Gateway đều phải qua filter này.
 *
 *  Flow xử lý:
 *  1. Kiểm tra path có phải public endpoint không?
 *     → Nếu CÓ: cho qua ngay (không cần token)
 *     → Nếu KHÔNG: tiếp tục bước 2
 *
 *  2. Kiểm tra Authorization header có "Bearer xxx" không?
 *     → Nếu KHÔNG: trả về 401 Unauthorized
 *
 *  3. Verify JWT token bằng secret key
 *     → Nếu token hết hạn hoặc sai: trả về 401
 *     → Nếu OK: extract claims (userId, email, role)
 *
 *  4. Forward thông tin user xuống downstream service qua headers:
 *     - X-User-Id   : ID người dùng
 *     - X-User-Email: email người dùng
 *     - X-User-Role : vai trò (USER, ADMIN, STAFF)
 *
 *  Implement:
 *  - GlobalFilter: áp dụng cho TẤT CẢ routes
 *  - Ordered.getOrder() = -1: chạy TRƯỚC các filter khác
 *
 *  JWT Library: io.jsonwebtoken (JJWT)
 *  Secret key: đọc từ application.yml (jwt.secret)
 * ╚══════════════════════════════════════════════════════════╝
 */
@Component      // Đăng ký Spring Bean — Gateway tự scan
public class JwtAuthFilter implements GlobalFilter, Ordered {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(JwtAuthFilter.class);

    /**
     * Secret key dùng để verify JWT token
     * Đọc từ application.yml: jwt.secret
     * Phải đủ dài (>= 256 bits = 32 bytes) cho HMAC-SHA256
     */
    @Value("${jwt.secret}")
    private String jwtSecret;

    /**
     * Danh sách endpoints công khai — KHÔNG cần JWT token
     *
     * Kiểm tra bằng startsWith():
     * - "/api/trips/search"  → match chính xác
     * - "/api/trips/123"     → match vì startsWith("/api/trips/")
     * - "/api/trips/123/seats" → match vì startsWith("/api/trips/")
     *
     * ⚠️ Lưu ý: "/api/trips/" (có dấu / cuối) sẽ match tất cả con của /api/trips/
     */
    private static final List<String> PUBLIC_ENDPOINTS = List.of(
        "/api/auth/login",           // Đăng nhập
        "/api/auth/register",        // Đăng ký
        "/api/auth/register-send-otp", // Đăng ký — gửi OTP
        "/api/auth/register-verify",  // Đăng ký — xác minh OTP + tạo tài khoản
        "/api/auth/refresh",         // Làm mới token
        "/api/auth/forgot-password", // Quên mật khẩu — gửi OTP
        "/api/auth/verify-otp",      // Xác minh OTP
        "/api/auth/reset-password",  // Đặt lại mật khẩu
        "/api/trips/search",         // Tìm chuyến (public)
        "/api/trips/schedule",       // Lịch trình xe (public)
        "/api/trips/",               // Xem chi tiết chuyến + sơ đồ ghế (public)
        "/api/routes",               // Xem danh sách tuyến (public)
        "/api/buses",                // Xem danh sách xe (public)
        "/api/pickup-points",        // Xem điểm đón/trả (public)
        "/api/cities",               // Xem danh sách tỉnh/thành phố (public)
        "/api/news",                 // Đọc tin tức (public)
        "/api/tickets/search",       // Tra cứu vé theo SĐT (public)
        "/actuator"                  // Health check endpoints
    );

    /**
     * Method chính của GlobalFilter — chạy cho MỌI request
     *
     * @param exchange : request + response (Reactive WebFlux)
     * @param chain    : filter chain tiếp theo
     * @return Mono<Void>: response (ok hoặc error)
     *
     * Spring Cloud Gateway dùng Reactive Stack (WebFlux) thay vì Servlet
     * → Phải dùng Mono/Flux (non-blocking) thay vì return trực tiếp
     */
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();

        // ── BƯỚC 1: Kiểm tra public endpoint ──
        boolean isPublic = PUBLIC_ENDPOINTS.stream().anyMatch(path::startsWith);
        if (isPublic) {
            // Public endpoint → cho qua ngay, không cần kiểm tra token
            return chain.filter(exchange);
        }

        // ── BƯỚC 2: Kiểm tra Authorization header ──
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // Thiếu header hoặc sai format → 401 Unauthorized
            return onError(exchange, "Missing or invalid Authorization header", HttpStatus.UNAUTHORIZED);
        }

        // ── BƯỚC 3: Verify JWT token ──
        String token = authHeader.substring(7); // Bỏ "Bearer " (7 ký tự)
        try {
            // Parse và verify token bằng secret key
            Claims claims = Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseSignedClaims(token)
                .getPayload();

            // ── BƯỚC 4: Forward thông tin user xuống downstream ──
            // Tạo request mới với thêm 3 headers: X-User-Id, X-User-Email, X-User-Role
            // → Downstream services (trip-service, order-service...) đọc headers này
            //   để biết ai đang thực hiện request (không cần verify lại JWT)
            ServerHttpRequest mutatedRequest = request.mutate()
                .header("X-User-Id", claims.getSubject())           // subject = userId
                .header("X-User-Email", claims.get("email", String.class))  // custom claim
                .header("X-User-Role", claims.get("role", String.class))    // custom claim
                .build();

            log.debug("JWT validated for user: {} path: {}", claims.getSubject(), path);

            // Cho request đi tiếp với thông tin user đã được inject
            return chain.filter(exchange.mutate().request(mutatedRequest).build());

        } catch (Exception e) {
            // Token hết hạn, sai signature, hoặc lỗi khác → 401
            log.warn("JWT validation failed for path {}: {}", path, e.getMessage());
            return onError(exchange, "Invalid or expired token", HttpStatus.UNAUTHORIZED);
        }
    }

    /**
     * Helper method: trả về response lỗi JSON
     *
     * VD: {"error":"Invalid or expired token","status":401}
     *
     * setContent-Type: application/json → frontend parse được
     * wrap(): chuyển String → DataBuffer (Reactive format)
     */
    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().add("Content-Type", "application/json");
        var body = String.format("{\"error\":\"%s\",\"status\":%d}", message, status.value());
        var buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }

    /**
     * Thứ tự chạy filter
     * -1 = chạy TRƯỚC tất cả filter khác
     *
     * Quan trọng: JWT filter phải chạy trước routing filter
     * → Để xác thực xong rồi mới chuyển request đến service khác
     */
    @Override
    public int getOrder() {
        return -1;
    }
}
