package com.vevui.newsservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "news")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class News {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 255)
    private String slug;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 500)
    private String excerpt;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 50)
    private String category; // Khuyến mãi, Tin tức, Hướng dẫn, Du lịch, Thông báo

    @Column(length = 500)
    private String imageUrl;

    @Column(length = 100)
    @Builder.Default
    private String author = "Vé Vui Team";

    @Column(nullable = false)
    @Builder.Default
    private Long views = 0L;

    @Column(nullable = false)
    @Builder.Default
    private Boolean featured = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean published = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime publishedAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
