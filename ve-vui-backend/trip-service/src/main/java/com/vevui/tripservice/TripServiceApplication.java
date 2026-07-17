package com.vevui.tripservice; // Khai báo package gốc của Trip Service

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  Trip Service — Điểm khởi động chính (Entry Point)
 *  - Chạy ở port 8810
 *  - Kết nối database: db_trips (MySQL)
 *  - Kết nối cache: Redis (dùng @Cacheable, @CacheEvict)
 *  - Đăng ký tên "trip-service" lên Eureka Server
 *
 *  Service này quản lý:
 *  → Tuyến xe (Route)   → Xe (Bus + BusType)
 *  → Chuyến đi (Trip)   → Điểm đón/trả (PickupPoint)
 * ╚══════════════════════════════════════════════════════════╝
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableCaching
@EnableScheduling
public class TripServiceApplication {
    public static void main(String[] args) {
        // Khởi chạy toàn bộ ứng dụng Spring Boot
        SpringApplication.run(TripServiceApplication.class, args);
    }
}
