package com.vevui.newsservice.entity; // Package chứa Entity ánh xạ với DB

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  Entity: News — Ánh xạ với bảng `news` trong db_news
 *
 *  News là BÀI VIẾT TIN TỨC — chứa thông tin bài viết, khuyến mãi.
 *
 *  Các trường chính:
 *  - slug      : URL-friendly version của title (unique)
 *  - title     : Tiêu đề bài viết
 *  - excerpt   : Tóm tắt ngắn (500 ký tự)
 *  - content   : Nội dung đầy đủ (TEXT — không giới hạn)
 *  - category  : Danh mục (Khuyến mãi, Tin tức, Hướng dẫn, Du lịch, Thông báo)
 *  - views     : Lượt xem (tự tăng khi đọc)
 *  - featured  : true = bài nổi bật (hiển thị trang chủ)
 *  - published : true = bài đã đăng, false = bản nháp/đã ẩn
 *
 *  Status flow:
 *  published=true (mặc định khi tạo) → published=false (admin xóa/ẩn)
 *  published=false → published=true (admin đăng lại)
 *
 *  ⚠️ published=true và publishedAt có thể gây nhầm lẫn:
 *  publishedAt thực ra là "ngày tạo" (CreationTimestamp)
 *  → Được cập nhật lại khi admin bấm "Đăng bài" (publish)
 * ╚══════════════════════════════════════════════════════════╝
 */
@Entity
@Table(name = "news") // Tên bảng trong MySQL db_news
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class News {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ID tự tăng
    private Long id;

    /**
     * Slug — URL-friendly version của title
     * VD: "Tin khuyến mãi hè 2024" → "tin-khuyen-mai-he-2024"
     * UNIQUE: mỗi bài viết có slug riêng
     * Dùng trong URL: /api/news/tin-khuyen-mai-he-2024
     */
    @Column(unique = true, nullable = false, length = 255)
    private String slug;

    @Column(nullable = false, length = 255)
    private String title; // Tiêu đề bài viết

    /**
     * Excerpt — tóm tắt ngắn gọn nội dung bài viết
     * Length 500: đủ cho 1-2 câu tóm tắt
     * Hiển thị trong danh sách bài viết
     */
    @Column(nullable = false, length = 500)
    private String excerpt;

    /**
     * Content — nội dung đầy đủ của bài viết
     * columnDefinition = "TEXT": dùng kiểu TEXT trong MySQL
     * → Không giới hạn độ dài (tối đa 65,535 ký tự)
     * → Phù hợp cho bài viết dài, HTML content
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * Category — danh mục bài viết
     * Các giá trị phổ biến: "Khuyến mãi", "Tin tức", "Hướng dẫn", "Du lịch", "Thông báo"
     * Length 50: đủ cho tên danh mục tiếng Việt
     */
    @Column(length = 50)
    private String category;

    @Column(length = 500)
    private String imageUrl; // URL ảnh đại diện bài viết

    /**
     * Author — tên tác giả
     * Mặc định: "Vé Vui Team"
     */
    @Column(length = 100)
    @Builder.Default
    private String author = "Vé Vui Team";

    /**
     * Views — lượt xem bài viết
     * Tự động tăng +1 khi ai đó truy cập GET /api/news/{slug}
     * Dùng @Modifying query để update atomic (tránh race condition)
     */
    @Column(nullable = false)
    @Builder.Default
    private Long views = 0L;

    /**
     * Featured — bài viết nổi bật
     * true = hiển thị trong carousel/section tin nổi bật trang chủ
     * Admin có thể toggle featured trên trang quản trị
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean featured = false;

    /**
     * Published — trạng thái đăng bài
     * true  = bài đã đăng (hiển thị trên trang public)
     * false = bản nháp hoặc đã bị ẩn (admin soft delete)
     *
     * Admin có thể toggle publish/draft qua endpoint:
     * PUT /api/admin/news/{id}/publish
     * PUT /api/admin/news/{id}/draft
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean published = true;

    /**
     * PublishedAt — thời điểm đăng bài
     * @CreationTimestamp: tự gán = LocalDateTime.now() khi INSERT lần đầu
     *
     * ⚠️ Được cập nhật lại khi admin bấm "Đăng bài" (publish)
     * → publishedAt thực chất là "lần đăng gần nhất"
     */
    @CreationTimestamp
    @Column(updatable = false) // Không cho sửa trực tiếp qua JPA
    private LocalDateTime publishedAt;

    /**
     * UpdatedAt — thời điểm cập nhật cuối
     * @UpdateTimestamp: tự động cập nhật = LocalDateTime.now() khi UPDATE
     */
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
