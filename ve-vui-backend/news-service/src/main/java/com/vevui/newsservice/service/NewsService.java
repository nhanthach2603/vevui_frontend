package com.vevui.newsservice.service;

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

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NewsService {

    private final NewsRepository newsRepository;

    @Cacheable(value = "news-list", key = "#pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<NewsDto.NewsResponse> getAll(Pageable pageable) {
        return newsRepository.findByPublishedTrueOrderByPublishedAtDesc(pageable)
                .map(this::toResponse);
    }

    @Cacheable(value = "news-featured")
    public List<NewsDto.NewsResponse> getFeatured() {
        return newsRepository.findByFeaturedTrueAndPublishedTrueOrderByPublishedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public NewsDto.NewsResponse getBySlug(String slug) {
        News news = newsRepository.findBySlugAndPublishedTrue(slug)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết: " + slug));
        newsRepository.incrementViews(news.getId());
        news.setViews(news.getViews() + 1);
        return toResponse(news);
    }

    @CacheEvict(value = {"news-list", "news-featured"}, allEntries = true)
    public NewsDto.NewsResponse create(NewsDto.CreateNewsRequest req) {
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
                .build();
        return toResponse(newsRepository.save(news));
    }

    @CacheEvict(value = {"news-list", "news-featured"}, allEntries = true)
    public NewsDto.NewsResponse update(Long id, NewsDto.CreateNewsRequest req) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết: " + id));
        if (req.getTitle() != null) news.setTitle(req.getTitle());
        if (req.getExcerpt() != null) news.setExcerpt(req.getExcerpt());
        if (req.getContent() != null) news.setContent(req.getContent());
        if (req.getCategory() != null) news.setCategory(req.getCategory());
        if (req.getImageUrl() != null) news.setImageUrl(req.getImageUrl());
        if (req.getFeatured() != null) news.setFeatured(req.getFeatured());
        return toResponse(newsRepository.save(news));
    }

    @CacheEvict(value = {"news-list", "news-featured"}, allEntries = true)
    public void delete(Long id) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết: " + id));
        news.setPublished(false);
        newsRepository.save(news);
    }

    // ── Admin: News Management ──

    public Page<NewsDto.NewsResponse> getAllAdmin(Pageable pageable) {
        return newsRepository.findAll(pageable).map(this::toResponse);
    }

    @CacheEvict(value = {"news-list", "news-featured"}, allEntries = true)
    public NewsDto.NewsResponse updatePublishStatus(Long id, boolean published) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết: " + id));
        news.setPublished(published);
        if (published) {
            news.setPublishedAt(java.time.LocalDateTime.now());
        }
        return toResponse(newsRepository.save(news));
    }

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
        if (n.getPublishedAt() != null) {
            dto.setPublishedAt(n.getPublishedAt().toLocalDate().toString());
        }
        return dto;
    }

    private String toSlug(String text) {
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(normalized)
                .replaceAll("")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
    }
}
