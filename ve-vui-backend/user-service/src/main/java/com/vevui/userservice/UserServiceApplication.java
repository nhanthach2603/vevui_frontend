package com.vevui.userservice; // Khai báo package (nhóm) chứa class này

import org.springframework.boot.SpringApplication;           // Dùng để khởi chạy ứng dụng Spring Boot
import org.springframework.boot.autoconfigure.SpringBootApplication; // Annotation kích hoạt toàn bộ Spring Boot auto-config
import org.springframework.cloud.client.discovery.EnableDiscoveryClient; // Annotation đăng ký service lên Eureka Server
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  User Service — Điểm khởi động chính (Entry Point)
 *  - Chạy ở port 8811
 *  - Kết nối database: db_users (MySQL)
 *  - Đăng ký tên "user-service" lên Eureka Server
 * ╚══════════════════════════════════════════════════════════╝
 */
@SpringBootApplication // = @Configuration + @EnableAutoConfiguration + @ComponentScan
                       // Tự động tìm và cấu hình tất cả Bean trong project
@EnableDiscoveryClient // Đăng ký service này lên Eureka để API Gateway có thể tìm thấy
@EnableScheduling      // Kích hoạt scheduled task (dọn OTP expired)
public class UserServiceApplication {

    public static void main(String[] args) {
        // Khởi chạy toàn bộ ứng dụng Spring Boot từ class này
        SpringApplication.run(UserServiceApplication.class, args);
    }
}
