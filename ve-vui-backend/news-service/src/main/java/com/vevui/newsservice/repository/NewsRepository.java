package com.vevui.newsservice.repository;

import com.vevui.newsservice.entity.News;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface NewsRepository extends JpaRepository<News, Long> {
    Page<News> findByPublishedTrueOrderByPublishedAtDesc(Pageable pageable);
    Optional<News> findBySlugAndPublishedTrue(String slug);
    List<News> findByFeaturedTrueAndPublishedTrueOrderByPublishedAtDesc();

    @Modifying
    @Transactional
    @Query("UPDATE News n SET n.views = n.views + 1 WHERE n.id = :id")
    void incrementViews(Long id);
}
