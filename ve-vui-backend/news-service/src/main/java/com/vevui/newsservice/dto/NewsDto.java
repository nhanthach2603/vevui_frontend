package com.vevui.newsservice.dto; // Package chứa Data Transfer Object

import lombok.Data;

import java.io.Serializable;

/**
 * NewsDto — Tập hợp tất cả DTO của News Service
 *
 * Chỉ có 2 DTO:
 * 1. NewsResponse   : Response body khi trả về bài viết
 * 2. CreateNewsRequest: Request body khi tạo/sửa bài viết
 *
 * NewsResponse implements Serializable:
 * → Có thể serialize sang JSON hoặc lưu vào Redis cache
 */
public class NewsDto {

    /**
     * Response body khi trả về thông tin bài viết
     * Dùng cho cả GET chi tiết, POST tạo, PUT cập nhật
     *
     * publishedAt: LocalDateTime → convert sang String (yyyy-MM-dd) trong Service
     */
    @Data
    public static class NewsResponse implements Serializable {
        private Long id;             // ID bài viết
        private String slug;         // URL-friendly: "tin-khuyen-mai-he-2024"
        private String title;        // Tiêu đề: "Tin khuyến mãi hè 2024"
        private String excerpt;      // Tóm tắt ngắn (500 ký tự)
        private String content;      // Nội dung đầy đủ (TEXT — không giới hạn độ dài)
        private String category;     // Danh mục: "Khuyến mãi", "Tin tức", "Hướng dẫn"...
        private String imageUrl;     // URL ảnh đại diện bài viết
        private String author;       // Tác giả: "Vé Vui Team"
        private Long views;          // Lượt xem (tự tăng khi đọc bài)
        private Boolean featured;    // true = bài nổi bật (hiển thị trang chủ)
        private String publishedAt;  // Ngày đăng: "2024-07-09"
    }

    /**
     * Request body khi tạo/sửa bài viết
     * Dùng chung cho cả POST (create) và PUT (update)
     *
     * slug: tùy chọn — nếu null tự tạo từ title
     * featured: tùy chọn — mặc định false
     */
    @Data
    public static class CreateNewsRequest {
        private String slug;         // URL slug (tùy chọn)
        private String title;        // Tiêu đề (bắt buộc)
        private String excerpt;      // Tóm tắt (bắt buộc)
        private String content;      // Nội dung đầy đủ (bắt buộc)
        private String category;     // Danh mục
        private String imageUrl;     // URL ảnh
        private String author;       // Tác giả (mặc định "Vé Vui Team")
        private Boolean featured;    // true = bài nổi bật
    }
}
