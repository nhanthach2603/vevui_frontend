package com.vevui.newsservice.repository; // Package chứa Repository — tầng truy cập DB

import com.vevui.newsservice.entity.News;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * NewsRepository — Tầng truy cập bảng `news` trong db_news
 *
 * Kế thừa JpaRepository<News, Long>:
 * - News: entity type
 * - Long: ID type
 *
 * JpaRepository cung cấp sẵn: save(), findById(), findAll(), deleteById()...
 *
 * Các query tùy chỉnh:
 * 1. findByPublishedTrue...         : lấy bài đã đăng
 * 2. findBySlugAndPublishedTrue     : lấy bài theo slug (chỉ bài đã đăng)
 * 3. findByFeaturedTrueAndPublishedTrue: bài nổi bật
 * 4. findByCategoryAndPublishedTrue : bài theo danh mục (native SQL — fix encoding)
 * 5. searchByKeyword                : tìm kiếm theo title/author/category
 * 6. incrementViews                 : tăng lượt xem atomic
 */
@Repository
public interface NewsRepository extends JpaRepository<News, Long> {

    /**
     * Lấy tất cả bài viết đã đăng (phân trang)
     * Spring tự sinh: SELECT * FROM news WHERE published = true ORDER BY published_at DESC
     * Dùng cho: trang danh sách tin tức (public)
     */
    Page<News> findByPublishedTrueOrderByPublishedAtDesc(Pageable pageable);

    /**
     * Lấy bài viết theo slug (chỉ bài đã đăng)
     * Spring tự sinh: SELECT * FROM news WHERE slug = ? AND published = true
     * Dùng cho: trang chi tiết bài viết (public)
     */
    Optional<News> findBySlugAndPublishedTrue(String slug);

    /**
     * Lấy tất cả bài nổi bật đã đăng
     * Spring tự sinh: SELECT * FROM news WHERE featured = true AND published = true
     *                  ORDER BY published_at DESC
     * Dùng cho: carousel tin tức trên trang chủ
     */
    List<News> findByFeaturedTrueAndPublishedTrueOrderByPublishedAtDesc();

    /**
     * Lấy bài viết theo danh mục (phân trang) — dùng Native SQL
     *
     * Tại sao dùng native query thay vì JPQL?
     * → Vì MySQL BIT(1) cho cột "published" có thể gây vấn đề với JPQL
     * → Native SQL: "WHERE published = 1" rõ ràng hơn
     * → Đã fix encoding UTF-8 trong JDBC URL
     *
     * countQuery: cần riêng vì count phải đúng với điều kiện
     * Dùng cho: trang danh mục (public)
     */
    @Query(value = "SELECT * FROM news WHERE category = :category AND published = 1 ORDER BY published_at DESC",
           countQuery = "SELECT COUNT(*) FROM news WHERE category = :category AND published = 1",
           nativeQuery = true)
    Page<News> findByCategoryAndPublishedTrue(@Param("category") String category, Pageable pageable);

    /**
     * Tìm kiếm bài viết theo từ khóa
     * Tìm trong: title, author, category
     * LOWER(): không phân biệt hoa/thường
     *
     * Dùng cho: Admin NewsPage — thanh tìm kiếm
     */
    @Query("SELECT n FROM News n WHERE LOWER(n.title) LIKE %:q% OR LOWER(n.author) LIKE %:q% OR LOWER(n.category) LIKE %:q%")
    List<News> searchByKeyword(@Param("q") String q);

    /**
     * Tăng lượt xem bài viết (+1)
     * @Modifying: đây là câu UPDATE, không phải SELECT
     * @Transactional: đảm bảo trong 1 transaction
     *
     * Dùng native query hoặc JPQL đều được:
     * JPQL: UPDATE News n SET n.views = n.views + 1 WHERE n.id = :id
     *
     * Atomic: dùng phép cộng trực tiếp trong SQL để tránh race condition
     * → 2 người đọc cùng lúc không bị mất lượt xem
     */
    @Modifying
    @Transactional
    @Query("UPDATE News n SET n.views = n.views + 1 WHERE n.id = :id")
    void incrementViews(Long id);

    /**
     * Lấy tất cả danh mục (category) duy nhất từ các bài viết đã đăng
     *
     * Dùng native SQL để tránh vấn đề encoding UTF-8
     * DISTINCT: loại bỏ trùng lặp
     * WHERE published = 1: chỉ lấy danh mục từ bài viết đã đăng
     *
     * Dùng cho: trang danh sách tin tức — hiển thị bộ lọc danh mục từ DB
     */
    @Query(value = "SELECT DISTINCT category FROM news WHERE published = 1 AND category IS NOT NULL ORDER BY category",
           nativeQuery = true)
    List<String> findDistinctCategories();

    /**
     * Đếm số bài viết có category trùng tên (case-insensitive)
     * Dùng cho CategoryService: kiểm tra trước khi xóa danh mục
     */
    long countByCategory(String category);
}
