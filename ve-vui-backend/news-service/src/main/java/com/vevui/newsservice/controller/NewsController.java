package com.vevui.newsservice.controller; // Package điều phối HTTP request

import com.vevui.newsservice.dto.NewsDto;
import com.vevui.newsservice.service.NewsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * NewsController — Điều phối HTTP request cho News Service
 *
 * Phân chia thành 2 nhóm endpoint chính:
 * 1. Public  : Đọc tin tức (theo danh mục, nổi bật, slug)
 * 2. Admin   : CRUD bài viết + quản lý đăng/bản nháp
 *
 * Tất cả response đều dùng ResponseEntity<T>
 * @ExceptionHandler: bắt IllegalArgumentException → 400 Bad Request
 */
@RestController
@RequiredArgsConstructor // Sinh constructor inject NewsService
public class NewsController {

    private final NewsService newsService;

    // ════════════════════════════════════════════════════════
    // 1. PUBLIC ENDPOINTS — Đọc tin tức (dành cho user)
    // ════════════════════════════════════════════════════════

    /**
     * Lấy danh sách bài viết đã đăng (phân trang)
     * GET /api/news?page=0&size=10
     *
     * Chỉ lấy bài có published=true
     * Sắp xếp theo publishedAt giảm dần (mới nhất lên đầu)
     * Response: Page<NewsResponse> — chứa content + totalElements + totalPages
     */
    @GetMapping("/api/news")
    public ResponseEntity<Page<NewsDto.NewsResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(newsService.getAll(
                PageRequest.of(page, size, Sort.by("publishedAt").descending())));
    }

    /**
     * Lấy bài viết nổi bật (featured)
     * GET /api/news/featured
     *
     * Trả về tất cả bài có featured=true + published=true
     * Dùng hiển thị trên trang chủ (carousel tin tức)
     */
    @GetMapping("/api/news/featured")
    public ResponseEntity<List<NewsDto.NewsResponse>> getFeatured() {
        return ResponseEntity.ok(newsService.getFeatured());
    }

    /**
     * Lấy chi tiết bài viết theo slug
     * GET /api/news/tin-khuyen-mai-he-2024
     *
     * Slug là URL-friendly version của title:
     * "Tin khuyến mãi hè 2024" → "tin-khuyen-mai-he-2024"
     *
     * Tự động tăng lượt xem (views + 1) khi truy cập
     */
    @GetMapping("/api/news/{slug}")
    public ResponseEntity<NewsDto.NewsResponse> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(newsService.getBySlug(slug));
    }

    /**
     * Lấy bài viết theo danh mục (phân trang)
     * GET /api/news/category/khuyen-mai?page=0&size=10
     *
     * Các danh mục: Khuyến mãi, Tin tức, Hướng dẫn, Du lịch, Thông báo
     * Chỉ lấy bài có published=true
     */
    @GetMapping("/api/news/category/{category}")
    public ResponseEntity<Page<NewsDto.NewsResponse>> getByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(newsService.getByCategory(category, PageRequest.of(page, size)));
    }

    // ════════════════════════════════════════════════════════
    // 2. ADMIN ENDPOINTS — Quản lý bài viết
    // ════════════════════════════════════════════════════════

    /**
     * Admin: Lấy tất cả bài viết (kể cả bản nháp, phân trang)
     * GET /api/admin/news?page=0&size=20
     *
     * Khác với public: lấy TẤT CẢ bài (published=true AND false)
     */
    @GetMapping("/api/admin/news")
    public ResponseEntity<Page<NewsDto.NewsResponse>> getAllAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(newsService.getAllAdmin(PageRequest.of(page, size)));
    }

    /**
     * Admin: Tìm kiếm bài viết theo từ khóa
     * GET /api/admin/news/search?q=khuyến mãi
     *
     * Tìm theo: title, author, category (không phân biệt hoa/thường)
     */
    @GetMapping("/api/admin/news/search")
    public ResponseEntity<List<NewsDto.NewsResponse>> searchNews(
            @RequestParam String q) {
        return ResponseEntity.ok(newsService.searchNews(q));
    }

    /**
     * Admin: Tạo bài viết mới
     * POST /api/admin/news
     * Body: { "title": "...", "content": "...", "category": "Khuyến mãi", ... }
     *
     * slug tự động tạo từ title nếu không truyền
     * published mặc định = true (tức là bài viết mới tạo sẽ hiển thị ngay)
     * HTTP Status 201 (Created) khi thành công
     */
    @PostMapping("/api/admin/news")
    public ResponseEntity<NewsDto.NewsResponse> create(@RequestBody NewsDto.CreateNewsRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(newsService.create(req));
    }

    /**
     * Admin: Lấy chi tiết 1 bài viết theo ID
     * GET /api/admin/news/1
     */
    @GetMapping("/api/admin/news/{id}")
    public ResponseEntity<NewsDto.NewsResponse> getNewsById(@PathVariable Long id) {
        return ResponseEntity.ok(newsService.getNewsById(id));
    }

    /**
     * Admin: Cập nhật bài viết (partial update)
     * PUT /api/admin/news/1
     * Body: { "title": "Title mới" }  ← chỉ cần gửi field muốn thay đổi
     */
    @PutMapping("/api/admin/news/{id}")
    public ResponseEntity<NewsDto.NewsResponse> update(
            @PathVariable Long id, @RequestBody NewsDto.CreateNewsRequest req) {
        return ResponseEntity.ok(newsService.update(id, req));
    }

    /**
     * Admin: Xóa bài viết (soft delete — set published=false)
     * DELETE /api/admin/news/1
     *
     * Không xóa DB, chỉ ẩn bài viết khỏi danh sách công khai
     */
    @DeleteMapping("/api/admin/news/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        newsService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Bài viết đã được xóa"));
    }

    /**
     * Admin: Đăng bài viết
     * PUT /api/admin/news/1/publish
     *
     * Set published=true + cập nhật publishedAt = now()
     * → Bài viết hiển thị trên trang public
     */
    @PutMapping("/api/admin/news/{id}/publish")
    public ResponseEntity<NewsDto.NewsResponse> publish(@PathVariable Long id) {
        return ResponseEntity.ok(newsService.updatePublishStatus(id, true));
    }

    /**
     * Admin: chuyển bài viết về bản nháp
     * PUT /api/admin/news/1/draft
     *
     * Set published=false → ẩn khỏi trang public
     */
    @PutMapping("/api/admin/news/{id}/draft")
    public ResponseEntity<NewsDto.NewsResponse> unpublish(@PathVariable Long id) {
        return ResponseEntity.ok(newsService.updatePublishStatus(id, false));
    }

    // ════════════════════════════════════════════════════════
    // ERROR HANDLER
    // ════════════════════════════════════════════════════════

    /**
     * Bắt IllegalArgumentException → trả về 400 Bad Request
     * VD: "Không tìm thấy bài viết: 999", "Không tìm thấy bài viết: tin-xyz"
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleError(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
