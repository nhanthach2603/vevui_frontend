package com.vevui.newsservice.controller;

import com.vevui.newsservice.dto.CategoryDto;
import com.vevui.newsservice.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * CategoryController — CRUD danh mục tin tức
 *
 * Public:  GET /api/news/categories        → tên danh mục active
 * Admin:   GET /api/admin/news-categories  → tất cả danh mục
 *          POST /api/admin/news-categories → tạo mới
 *          PUT  /api/admin/news-categories/{id} → cập nhật
 *          DELETE /api/admin/news-categories/{id} → xóa
 */
@RestController
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    // ════════════════════════════════════════════════════════
    // PUBLIC
    // ════════════════════════════════════════════════════════

    /**
     * Lấy danh sách tên danh mục active (dùng cho user frontend filter)
     */
    @GetMapping("/api/news/categories")
    public ResponseEntity<List<String>> getActiveCategories() {
        return ResponseEntity.ok(categoryService.getActiveCategoryNames());
    }

    // ════════════════════════════════════════════════════════
    // ADMIN
    // ════════════════════════════════════════════════════════

    @GetMapping("/api/admin/news-categories")
    public ResponseEntity<List<CategoryDto.CategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @PostMapping("/api/admin/news-categories")
    public ResponseEntity<CategoryDto.CategoryResponse> createCategory(
            @RequestBody CategoryDto.CreateCategoryRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.create(req));
    }

    @PutMapping("/api/admin/news-categories/{id}")
    public ResponseEntity<CategoryDto.CategoryResponse> updateCategory(
            @PathVariable Long id,
            @RequestBody CategoryDto.CreateCategoryRequest req) {
        return ResponseEntity.ok(categoryService.update(id, req));
    }

    @DeleteMapping("/api/admin/news-categories/{id}")
    public ResponseEntity<Map<String, String>> deleteCategory(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Danh mục đã được xóa"));
    }

    // ════════════════════════════════════════════════════════
    // ERROR HANDLER
    // ════════════════════════════════════════════════════════

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleError(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
