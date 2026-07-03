package com.vevui.newsservice.controller;

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

@RestController
@RequiredArgsConstructor
public class NewsController {

    private final NewsService newsService;

    @GetMapping("/api/news")
    public ResponseEntity<Page<NewsDto.NewsResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(newsService.getAll(
                PageRequest.of(page, size, Sort.by("publishedAt").descending())));
    }

    @GetMapping("/api/news/featured")
    public ResponseEntity<List<NewsDto.NewsResponse>> getFeatured() {
        return ResponseEntity.ok(newsService.getFeatured());
    }

    @GetMapping("/api/news/{slug}")
    public ResponseEntity<NewsDto.NewsResponse> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(newsService.getBySlug(slug));
    }

    @GetMapping("/api/news/category/{category}")
    public ResponseEntity<Page<NewsDto.NewsResponse>> getByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(newsService.getByCategory(category, PageRequest.of(page, size)));
    }

    // ── Admin ──

    @GetMapping("/api/admin/news")
    public ResponseEntity<Page<NewsDto.NewsResponse>> getAllAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(newsService.getAllAdmin(PageRequest.of(page, size)));
    }

    @GetMapping("/api/admin/news/search")
    public ResponseEntity<List<NewsDto.NewsResponse>> searchNews(
            @RequestParam String q) {
        return ResponseEntity.ok(newsService.searchNews(q));
    }

    @PostMapping("/api/admin/news")
    public ResponseEntity<NewsDto.NewsResponse> create(@RequestBody NewsDto.CreateNewsRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(newsService.create(req));
    }

    @GetMapping("/api/admin/news/{id}")
    public ResponseEntity<NewsDto.NewsResponse> getNewsById(@PathVariable Long id) {
        return ResponseEntity.ok(newsService.getNewsById(id));
    }

    @PutMapping("/api/admin/news/{id}")
    public ResponseEntity<NewsDto.NewsResponse> update(
            @PathVariable Long id, @RequestBody NewsDto.CreateNewsRequest req) {
        return ResponseEntity.ok(newsService.update(id, req));
    }

    @DeleteMapping("/api/admin/news/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        newsService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Bài viết đã được xóa"));
    }

    @PutMapping("/api/admin/news/{id}/publish")
    public ResponseEntity<NewsDto.NewsResponse> publish(@PathVariable Long id) {
        return ResponseEntity.ok(newsService.updatePublishStatus(id, true));
    }

    @PutMapping("/api/admin/news/{id}/draft")
    public ResponseEntity<NewsDto.NewsResponse> unpublish(@PathVariable Long id) {
        return ResponseEntity.ok(newsService.updatePublishStatus(id, false));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleError(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
