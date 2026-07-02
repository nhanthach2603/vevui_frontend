package com.vevui.newsservice.dto;

import lombok.Data;

public class NewsDto {

    @Data
    public static class NewsResponse {
        private Long id;
        private String slug;
        private String title;
        private String excerpt;
        private String content;
        private String category;
        private String imageUrl;
        private String author;
        private Long views;
        private Boolean featured;
        private String publishedAt;
    }

    @Data
    public static class CreateNewsRequest {
        private String slug;
        private String title;
        private String excerpt;
        private String content;
        private String category;
        private String imageUrl;
        private String author;
        private Boolean featured;
    }
}
