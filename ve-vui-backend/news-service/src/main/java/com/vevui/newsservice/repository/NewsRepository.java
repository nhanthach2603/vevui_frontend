package com.vevui.newsservice.repository;

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

@Repository
public interface NewsRepository extends JpaRepository<News, Long> {
    Page<News> findByPublishedTrueOrderByPublishedAtDesc(Pageable pageable);
    Optional<News> findBySlugAndPublishedTrue(String slug);
    List<News> findByFeaturedTrueAndPublishedTrueOrderByPublishedAtDesc();

    @Query(value = "SELECT * FROM news WHERE category = :category AND published = 1 ORDER BY published_at DESC",
           countQuery = "SELECT COUNT(*) FROM news WHERE category = :category AND published = 1",
           nativeQuery = true)
    Page<News> findByCategoryAndPublishedTrue(@Param("category") String category, Pageable pageable);

    @Query("SELECT n FROM News n WHERE LOWER(n.title) LIKE %:q% OR LOWER(n.author) LIKE %:q% OR LOWER(n.category) LIKE %:q%")
    List<News> searchByKeyword(@Param("q") String q);

    @Modifying
    @Transactional
    @Query("UPDATE News n SET n.views = n.views + 1 WHERE n.id = :id")
    void incrementViews(Long id);
}
