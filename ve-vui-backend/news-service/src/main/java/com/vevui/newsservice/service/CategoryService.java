package com.vevui.newsservice.service;

import com.vevui.newsservice.dto.CategoryDto;
import com.vevui.newsservice.entity.Category;
import com.vevui.newsservice.repository.CategoryRepository;
import com.vevui.newsservice.repository.NewsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * CategoryService — CRUD danh mục tin tức
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final NewsRepository newsRepository;

    /**
     * Lấy danh sách danh mục active (public)
     */
    @Cacheable(value = "news-categories")
    public List<String> getActiveCategoryNames() {
        return categoryRepository.findByActiveTrueOrderBySortOrderAscNameAsc()
                .stream()
                .map(Category::getName)
                .collect(Collectors.toList());
    }

    /**
     * Lấy tất cả danh mục cho admin (kể cả inactive)
     */
    public List<CategoryDto.CategoryResponse> getAllCategories() {
        return categoryRepository.findAllByOrderBySortOrderAscNameAsc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Tạo danh mục mới
     */
    @CacheEvict(value = "news-categories", allEntries = true)
    @Transactional
    public CategoryDto.CategoryResponse create(CategoryDto.CreateCategoryRequest req) {
        if (req.getName() == null || req.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên danh mục không được để trống");
        }
        String name = req.getName().trim();
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Danh mục \"" + name + "\" đã tồn tại");
        }
        Category cat = Category.builder()
                .name(name)
                .sortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0)
                .active(req.getActive() != null ? req.getActive() : true)
                .build();
        return toResponse(categoryRepository.save(cat));
    }

    /**
     * Cập nhật danh mục
     */
    @CacheEvict(value = "news-categories", allEntries = true)
    @Transactional
    public CategoryDto.CategoryResponse update(Long id, CategoryDto.CreateCategoryRequest req) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục: " + id));

        if (req.getName() != null) {
            String newName = req.getName().trim();
            if (newName.isEmpty()) {
                throw new IllegalArgumentException("Tên danh mục không được để trống");
            }
            // Kiểm tra trùng tên (ngoại trừ chính nó)
            categoryRepository.findByNameIgnoreCase(newName)
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(id)) {
                            throw new IllegalArgumentException("Danh mục \"" + newName + "\" đã tồn tại");
                        }
                    });
            cat.setName(newName);
        }
        if (req.getSortOrder() != null) cat.setSortOrder(req.getSortOrder());
        if (req.getActive() != null) cat.setActive(req.getActive());

        return toResponse(categoryRepository.save(cat));
    }

    /**
     * Xóa danh mục — kiểm tra bài viết đang dùng
     */
    @CacheEvict(value = "news-categories", allEntries = true)
    @Transactional
    public void delete(Long id) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục: " + id));

        // Đếm bài viết đang dùng danh mục này
        long articleCount = newsRepository.countByCategory(cat.getName());
        if (articleCount > 0) {
            throw new IllegalArgumentException(
                "Không thể xóa danh mục \"" + cat.getName() + "\" vì đang có " + articleCount + " bài viết");
        }

        categoryRepository.deleteById(id);
    }

    /**
     * Category entity → Response DTO
     */
    private CategoryDto.CategoryResponse toResponse(Category cat) {
        CategoryDto.CategoryResponse dto = new CategoryDto.CategoryResponse();
        dto.setId(cat.getId());
        dto.setName(cat.getName());
        dto.setSortOrder(cat.getSortOrder());
        dto.setActive(cat.getActive());
        dto.setArticleCount(newsRepository.countByCategory(cat.getName()));
        dto.setCreatedAt(cat.getCreatedAt());
        return dto;
    }
}
