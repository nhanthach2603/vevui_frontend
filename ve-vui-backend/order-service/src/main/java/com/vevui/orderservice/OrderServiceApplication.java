package com.vevui.orderservice; // Package gốc của Order Service

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;  // Đăng ký lên Eureka
import org.springframework.cloud.openfeign.EnableFeignClients;           // Kích hoạt Feign Client

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  Order Service — Điểm khởi động chính (Entry Point)
 *
 *  Chạy ở port 8813, kết nối database: db_orders (MySQL)
 *
 *  Service này quản lý:
 *  → Đặt vé xe (Ticket) — atomically: khóa ghế + lưu vé
 *  → Mã giảm giá (Coupon)
 *  → Thanh toán (mock)
 *  → Gửi sự kiện Kafka khi đặt vé thành công
 *
 *  Giao tiếp với service khác:
 *  → trip-service qua Feign Client (khóa ghế khi đặt)
 *  → Kafka broker (gửi sự kiện booking-confirmed)
 *
 *  Annotations:
 *  @SpringBootApplication: auto-config, component scan, bean registration
 *  @EnableDiscoveryClient : đăng ký tên "order-service" lên Eureka Server
 *  @EnableFeignClients    : kích hoạt Feign Client để gọi trip-service
 * ╚══════════════════════════════════════════════════════════╝
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class OrderServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}
