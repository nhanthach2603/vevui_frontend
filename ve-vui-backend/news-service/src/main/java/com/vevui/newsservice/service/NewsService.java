package com.vevui.newsservice.service; // Package chứa tầng xử lý business logic

import com.vevui.newsservice.dto.NewsDto;
import com.vevui.newsservice.entity.News;
import com.vevui.newsservice.repository.NewsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer; // Hỗ trợ chuyển dấu tiếng Việt
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  NewsService — Tầng xử lý nghiệp vụ cho News Service
 *
 *  Quản lý 3 nhóm chức năng:
 *  1. PUBLIC  : Đọc tin tức (danh sách, nổi bật, theo slug, theo danh mục)
 *  2. ADMIN   : CRUD bài viết + quản lý publish/draft
 *  3. CACHE   : Redis cache cho danh sách bài viết (5 phút) và bài nổi bật (30 phút)
 *
 *  Đặc biệt:
 *  - toSlug(): chuyển tiếng Việt có dấu → slug URL-friendly
 *    "Tin khuyến mãi hè 2024" → "tin-khuyen-mai-he-2024"
 *    "Xe limousine 44 chỗ" → "xe-limousine-44-cho"
 *
 *  Cache strategy:
 *  - @Cacheable  : Đọc cache trước, miss → query DB → lưu cache
 *  - @CacheEvict : Xóa cache khi dữ liệu thay đổi (create/update/delete)
 *  - Cache names: "news-list" (5 phút), "news-featured" (30 phút)
 * ╚══════════════════════════════════════════════════════════╝
 */
@Slf4j          // Logger
@Service        // Spring Bean kiểu Service
@RequiredArgsConstructor // Inject NewsRepository
public class NewsService {

    private final NewsRepository newsRepository; // Truy cập DB

    // ════════════════════════════════════════════════════════
    // 1. PUBLIC OPERATIONS — Đọc tin tức
    // ════════════════════════════════════════════════════════

    /**
     * Lấy danh sách bài viết đã đăng (phân trang)
     * GET /api/news?page=0&size=10
     *
     * @Cacheable: cache theo page number + page size
     * Key: "news-list::0-10" (trang 0, 10 bài/trang)
     * TTL: 5 phút (cấu hình trong RedisConfig hoặc application.yml)
     *
     * Cache hit → trả về ngay từ Redis (~1ms)
     * Cache miss → query DB → lưu cache
     */
    @Cacheable(value = "news-list", key = "#pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<NewsDto.NewsResponse> getAll(Pageable pageable) {
        return newsRepository.findByPublishedTrueOrderByPublishedAtDesc(pageable)
                .map(this::toResponse); // Convert Entity → DTO
    }

    /**
     * Lấy bài viết nổi bật (featured)
     * GET /api/news/featured
     *
     * @Cacheable: cache riêng vì danh sách featured ít thay đổi
     * TTL: 30 phút
     */
    @Cacheable(value = "news-featured")
    public List<NewsDto.NewsResponse> getFeatured() {
        return newsRepository.findByFeaturedTrueAndPublishedTrueOrderByPublishedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Lấy chi tiết bài viết theo slug + tăng lượt xem
     * GET /api/news/tin-khuyen-mai-he-2024
     *
     * @Transactional: vì vừa đọc vừa update views
     *
     * Không cache vì mỗi lần đọc.views + 1
     * → Cache sẽ stale nếu ai đó vừa đọc
     */
    @Transactional // Cần transaction vì có update views
    public NewsDto.NewsResponse getBySlug(String slug) {
        News news = newsRepository.findBySlugAndPublishedTrue(slug)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết: " + slug));

        // Tăng lượt xem atomic (SQL: views = views + 1)
        newsRepository.incrementViews(news.getId());
        // Cập nhật trong memory để trả về đúng views mới nhất
        news.setViews(news.getViews() + 1);

        return toResponse(news);
    }

    /**
     * Lấy bài viết theo danh mục (phân trang)
     * GET /api/news/category/khuyen-mai?page=0&size=10
     *
     * Dùng native SQL query trong Repository để fix encoding UTF-8
     */
    public Page<NewsDto.NewsResponse> getByCategory(String category, Pageable pageable) {
        return newsRepository.findByCategoryAndPublishedTrue(category, pageable)
                .map(this::toResponse);
    }

    /**
     * Lấy tất cả danh mục (category) duy nhất từ DB
     * GET /api/news/categories
     *
     * Trả về danh sách tên danh mục tiếng Việt có dấu
     * VD: ["Du lich", "Huong dan", "Khuyen mai", "Thong bao", "Tin tuc"]
     *
     * Dùng JPQL (không phải native SQL) vì native SQL bị garbled encoding
     * findAll() → Java distinct → trả về ASCII names từ DB
     */
    public List<String> getCategories() {
        return newsRepository.findByPublishedTrueOrderByPublishedAtDesc(
                org.springframework.data.domain.PageRequest.of(0, 1000))
                .getContent().stream()
                .map(News::getCategory)
                .filter(c -> c != null && !c.isBlank())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    /**
     * Loại bỏ dấu tiếng Việt khỏi chuỗi
     * "Du lịch" → "Du lich"
     * "Khuyến mãi" → "Khuyen mai"
     *
     * Dùng NFD normalize + xóa Combining Diacritical Marks
     */
    private String removeDiacritics(String input) {
        if (input == null) return null;
        String normalized = java.text.Normalizer.normalize(input, java.text.Normalizer.Form.NFD);
        String result = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        result = result.replace('\u0110', 'D');
        result = result.replace('\u0111', 'd');
        return result;
    }

    // ════════════════════════════════════════════════════════
    // 2. ADMIN OPERATIONS — CRUD bài viết
    // ════════════════════════════════════════════════════════

    /**
     * Admin: Tạo bài viết mới
     * POST /api/admin/news
     *
     * slug tự động từ title nếu không truyền
     * published = true (mặc định) → bài viết hiển thị ngay
     *
     * @CacheEvict: xóa TẤT CẢ cache "news-list" và "news-featured"
     * → Lần sau query sẽ lấy từ DB (data mới nhất)
     */
    @CacheEvict(value = {"news-list", "news-featured"}, allEntries = true)
    public NewsDto.NewsResponse create(NewsDto.CreateNewsRequest req) {
        // Tạo slug từ title nếu không truyền
        String slug = req.getSlug() != null ? req.getSlug() : toSlug(req.getTitle());

        News news = News.builder()
                .slug(slug)
                .title(req.getTitle())
                .excerpt(req.getExcerpt())
                .content(req.getContent())
                .category(req.getCategory())
                .imageUrl(req.getImageUrl())
                .author(req.getAuthor() != null ? req.getAuthor() : "Vé Vui Team")
                .featured(Boolean.TRUE.equals(req.getFeatured()))
                .build(); // published = true (mặc định), publishedAt = now()
        return toResponse(newsRepository.save(news));
    }

    /**
     * Admin: Cập nhật bài viết (partial update)
     * PUT /api/admin/news/1
     *
     * Field nào null thì giữ nguyên, chỉ cập nhật field có giá trị
     * @CacheEvict: xóa cache sau khi cập nhật
     */
    @CacheEvict(value = {"news-list", "news-featured"}, allEntries = true)
    public NewsDto.NewsResponse update(Long id, NewsDto.CreateNewsRequest req) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết: " + id));

        // Partial update: chỉ set field nào không null
        if (req.getTitle() != null) news.setTitle(req.getTitle());
        if (req.getExcerpt() != null) news.setExcerpt(req.getExcerpt());
        if (req.getContent() != null) news.setContent(req.getContent());
        if (req.getCategory() != null) news.setCategory(req.getCategory());
        if (req.getImageUrl() != null) news.setImageUrl(req.getImageUrl());
        if (req.getFeatured() != null) news.setFeatured(req.getFeatured());

        return toResponse(newsRepository.save(news));
    }

    /**
     * Admin: Xóa bài viết (soft delete — set published=false)
     * DELETE /api/admin/news/1
     *
     * Không xóa DB, chỉ ẩn bài viết khỏi trang public
     * Giữ lại dữ liệu để admin có thể khôi phục
     * @CacheEvict: xóa cache sau khi xóa
     */
    @CacheEvict(value = {"news-list", "news-featured"}, allEntries = true)
    public void delete(Long id) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết: " + id));
        news.setPublished(false); // Soft delete
        newsRepository.save(news);
    }

    /**
     * Admin: Lấy chi tiết 1 bài viết theo ID
     * GET /api/admin/news/1
     *
     * Không filter theo published — admin xem được cả bản nháp
     */
    public NewsDto.NewsResponse getNewsById(Long id) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết: " + id));
        return toResponse(news);
    }

    /**
     * Admin: Tìm kiếm bài viết theo từ khóa
     * GET /api/admin/news/search?q=khuyến mãi
     *
     * Tìm theo: title, author, category
     */
    public List<NewsDto.NewsResponse> searchNews(String q) {
        return newsRepository.searchByKeyword(q.toLowerCase()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Admin: Lấy tất cả bài viết (phân trang, kể cả bản nháp)
     * GET /api/admin/news?page=0&size=20
     *
     * findAll() — không filter published
     */
    public Page<NewsDto.NewsResponse> getAllAdmin(Pageable pageable) {
        return newsRepository.findAll(pageable).map(this::toResponse);
    }

    /**
     * Admin: Cập nhật trạng thái publish/draft
     * PUT /api/admin/news/{id}/publish  → published=true
     * PUT /api/admin/news/{id}/draft    → published=false
     *
     * Khi publish: cập nhật publishedAt = now() (ngày đăng mới nhất)
     * @CacheEvict: xóa cache
     */
    @CacheEvict(value = {"news-list", "news-featured"}, allEntries = true)
    public NewsDto.NewsResponse updatePublishStatus(Long id, boolean published) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết: " + id));
        news.setPublished(published);
        if (published) {
            // Khi đăng bài → cập nhật publishedAt = now()
            // publishedAt là @CreationTimestamp nên chỉ cập nhật được qua cách này
            news.setPublishedAt(java.time.LocalDateTime.now());
        }
        return toResponse(newsRepository.save(news));
    }

    // ════════════════════════════════════════════════════════
    // ── PRIVATE HELPER METHODS ──
    // ════════════════════════════════════════════════════════

    /**
     * Chuyển News entity → NewsResponse DTO
     *
     * publishedAt: LocalDateTime → String (yyyy-MM-dd)
     * VD: LocalDateTime.of(2024, 7, 9, 14, 30) → "2024-07-09"
     */
    private NewsDto.NewsResponse toResponse(News n) {
        NewsDto.NewsResponse dto = new NewsDto.NewsResponse();
        dto.setId(n.getId());
        dto.setSlug(n.getSlug());
        dto.setTitle(n.getTitle());
        dto.setExcerpt(n.getExcerpt());
        dto.setContent(n.getContent());
        dto.setCategory(n.getCategory());
        dto.setImageUrl(n.getImageUrl());
        dto.setAuthor(n.getAuthor());
        dto.setViews(n.getViews());
        dto.setFeatured(n.getFeatured());
        // Chỉ set publishedAt nếu khác null (tránh NPE)
        if (n.getPublishedAt() != null) {
            dto.setPublishedAt(n.getPublishedAt().toLocalDate().toString());
        }
        return dto;
    }

    /**
     * Tạo slug từ text tiếng Việt
     *
     * Thuật toán (4 bước):
     * 1. Normalizer.normalize(text, Form.NFD): tách dấu tiếng Việt
     *    "Tin khuyến mãi" → "Tin khuye^`n ma\u0303i"
     *
     * 2. \\p{InCombiningDiacriticalMarks}: xóa tất cả dấu
     *    "Tin khuye^`n ma\u0303i" → "Tin khuyen mai"
     *
     * 3. toLowerCase + replaceAll("[^a-z0-9\\s-]", ""): chuyển thường, xóa ký tự đặc biệt
     *    "Tin khuyen mai" → "tin khuyen mai"
     *
     * 4. replaceAll("\\s+", "-") + replaceAll("-+", "-"): thay khoảng trắng bằng dấu gạch
     *    "tin khuyen mai" → "tin-khuyen-mai"
     *
     * Ví dụ:
     * "Tin khuyến mãi hè 2024" → "tin-khuyen-mai-he-2024"
     * "Xe limousine 44 chỗ" → "xe-limousine-44-cho"
     * "Hướng dẫn đặt vé Online" → "huong-dan-dat-ve-online"
     */
    private String toSlug(String text) {
        // Bước 1: Tách dấu tiếng Việt
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        // Bước 2: Xóa tất cả dấu
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(normalized)
                .replaceAll("")                    // Xóa dấu
                .toLowerCase(Locale.ROOT)          // Chuyển thường
                .replaceAll("[^a-z0-9\\s-]", "")  // Xóa ký tự đặc biệt (giữ chữ, số, spaces, dash)
                .replaceAll("\\s+", "-")           // Spaces → dash
                .replaceAll("-+", "-");            // Gộp nhiều dash liên tiếp thành 1
    }
}
