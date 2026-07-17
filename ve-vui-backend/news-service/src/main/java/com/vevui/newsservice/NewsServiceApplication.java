package com.vevui.newsservice; // Package gốc của News Service

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;          // Kích hoạt Redis Cache
import org.springframework.cloud.client.discovery.EnableDiscoveryClient; // Đăng ký lên Eureka

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  News Service — Điểm khởi động chính (Entry Point)
 *
 *  Chạy ở port 8812, kết nối database: db_news (MySQL)
 *  Cache: Redis (dùng @Cacheable, @CacheEvict)
 *
 *  Service này quản lý bài viết tin tức/tin khuyến mãi:
 *  → CRUD bài viết (admin)
 *  → Đọc bài viết theo danh mục, nổi bật, slug (public)
 *  → Tăng lượt xem khi đọc bài
 *
 *  Đặc biệt:
 *  - Slug tự động tạo từ title (hỗ trợ tiếng Việt)
 *  - Cache Redis: news-list (5 phút), news-featured (30 phút)
 *  - characterEncoding=UTF-8 trong JDBC URL (xử lý dấu tiếng Việt)
 *
 *  Annotations:
 *  @SpringBootApplication: auto-config, component scan
 *  @EnableDiscoveryClient : đăng ký tên "news-service" lên Eureka
 *  @EnableCaching          : bật Spring Cache (Redis)
 * ╚══════════════════════════════════════════════════════════╝
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableCaching // Bật cache — cấu hình Redis trong application.yml
public class NewsServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(NewsServiceApplication.class, args);
    }
}
