package com.vevui.gateway; // Package gốc của API Gateway

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  API Gateway — Cửa ngõ duy nhất của toàn bộ hệ thống
 *
 *  Chạy ở port 8900 — tất cả request từ frontend đều đi qua đây
 *
 *  Vai trò:
 *  1. ROUTING    : Chuyển request đến microservice đúng (qua Eureka)
 *  2. AUTH       : Xác thực JWT token (JwtAuthFilter)
 *  3. CORS       : Xử lý cross-origin cho frontend (localhost:5173/5174)
 *  4. LOAD BAL   : Load-balancing giữa nhiều instances cùng service
 *
 *  Flow request:
 *  Frontend → localhost:8900/api/trips/search → Gateway路由 → trip-service
 *
 *  Tại sao cần API Gateway?
 *  → Frontend không cần biết địa chỉ IP/port của từng microservice
 *  →集中 authentication, CORS, rate limiting tại 1 chỗ
 *  → Dễ thay đổi backend mà không cần sửa frontend
 *
 *  Annotations:
 *  @SpringBootApplication: Spring Boot auto-config
 *
 *  Không cần @EnableDiscoveryClient vì Spring Cloud Gateway
 *  tự động detect Eureka client từ classpath
 * ╚══════════════════════════════════════════════════════════╝
 */
@SpringBootApplication
public class ApiGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
