package com.vevui.userservice.security; // Package bảo mật

import org.springframework.context.annotation.Bean;                                   // Khai báo Spring Bean
import org.springframework.context.annotation.Configuration;                          // Đây là class cấu hình Spring
import org.springframework.security.config.annotation.web.builders.HttpSecurity;      // Cấu hình bảo mật HTTP
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity; // Kích hoạt Spring Security
import org.springframework.security.config.http.SessionCreationPolicy;               // Chính sách quản lý session
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;              // Thuật toán mã hóa mật khẩu BCrypt
import org.springframework.security.crypto.password.PasswordEncoder;                  // Interface chuẩn của Spring Security
import org.springframework.security.web.SecurityFilterChain;                          // Chuỗi filter xử lý request HTTP

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  SecurityConfig — Cấu hình Spring Security cho User Service
 *
 *  Lưu ý quan trọng:
 *  Vì User Service chạy phía sau API Gateway, việc xác thực JWT
 *  đã được API Gateway xử lý trước rồi. Do đó, User Service
 *  cho phép tất cả request đi qua (.anyRequest().permitAll())
 *  và chỉ tự xử lý /api/auth/** (đăng ký, đăng nhập).
 * ╚══════════════════════════════════════════════════════════╝
 */
@Configuration    // Đánh dấu đây là class cấu hình — Spring sẽ xử lý các @Bean trong này
@EnableWebSecurity // Kích hoạt cơ chế bảo mật web của Spring Security
public class SecurityConfig {

    /**
     * Cấu hình chuỗi filter bảo mật cho HTTP request
     *
     * SecurityFilterChain là trung tâm của Spring Security —
     * mọi HTTP request đều đi qua đây trước khi vào controller.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Tắt CSRF (Cross-Site Request Forgery) vì:
            // - API REST không dùng session/cookie nên không cần bảo vệ CSRF
            // - Dùng JWT thay thế
            .csrf(csrf -> csrf.disable())

            // Tắt CORS ở đây vì CORS đã được xử lý tập trung ở API Gateway
            // (tránh cấu hình CORS bị duplicate)
            .cors(cors -> cors.disable())

            // Đặt chính sách session là STATELESS:
            // - Mỗi request phải tự xác thực (qua JWT)
            // - Server không lưu session → phù hợp với kiến trúc Microservices
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Cấu hình phân quyền endpoint:
            .authorizeHttpRequests(auth -> auth
                // /api/auth/** (register, login, refresh): cho phép tất cả không cần token
                .requestMatchers("/api/auth/**").permitAll()

                // /actuator/**: endpoint health check của Spring Boot — cho phép công khai
                // (API Gateway dùng để kiểm tra service có khỏe không)
                .requestMatchers("/actuator/**").permitAll()

                // Tất cả endpoint còn lại: cũng permitAll vì JWT đã được API Gateway xác thực rồi
                // Trong production nên đổi thành .authenticated() và thêm JWT filter riêng
                .anyRequest().permitAll()
            );

        return http.build(); // Trả về SecurityFilterChain đã được cấu hình
    }

    /**
     * Bean PasswordEncoder — dùng thuật toán BCrypt để mã hóa mật khẩu
     *
     * BCrypt đặc điểm:
     * - Mỗi lần hash cho kết quả khác nhau (do salt ngẫu nhiên)
     * - Không thể giải mã ngược (one-way hash)
     * - Tốc độ hash chậm có chủ ý → khó brute force
     * - passwordEncoder.encode("abc123")  → chuỗi hash BCrypt
     * - passwordEncoder.matches("abc123", hash) → true/false
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // Strength mặc định = 10 (2^10 = 1024 vòng lặp)
    }
}

