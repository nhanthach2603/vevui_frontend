package com.vevui.newsservice.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * DTO cho Category management
 */
public class CategoryDto {

    @Data
    public static class CategoryResponse implements Serializable {
        private Long id;
        private String name;
        private Integer sortOrder;
        private Boolean active;
        private Long articleCount;
        private LocalDateTime createdAt;
    }

    @Data
    public static class CreateCategoryRequest {
        private String name;
        private Integer sortOrder;
        private Boolean active;
    }
}
