package com.vevui.tripservice.config; // Package chứa các class cấu hình Spring

// ── Jackson (JSON serializer) ──
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule; // Hỗ trợ LocalDate, LocalTime, LocalDateTime

// ── Spring Cache + Redis ──
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;  // Cấu hình 1 cache name
import org.springframework.data.redis.cache.RedisCacheManager;        // Quản lý toàn bộ cache
import org.springframework.data.redis.connection.RedisConnectionFactory; // Kết nối đến Redis server
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer; // Serialize Java object → JSON khi lưu Redis
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer; // Serialize cache key → String

import java.time.Duration; // Biểu diễn khoảng thời gian (TTL)
import java.util.HashMap;
import java.util.Map;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  RedisConfig — Cấu hình Redis Cache cho Trip Service
 *
 *  Tại sao cần cache?
 *  → Danh sách tuyến (routes) và kết quả tìm chuyến (trips)
 *    là dữ liệu được đọc rất nhiều nhưng thay đổi ít
 *  → Cache giảm tải cho MySQL, tăng tốc response
 *
 *  Chiến lược TTL (Time To Live — thời gian sống của cache):
 *  - routes : 30 phút (tuyến ít thay đổi)
 *  - trips  :  5 phút (giá vé, ghế có thể thay đổi nhanh hơn)
 *  - default: 10 phút (các cache khác)
 *
 *  Cache được kích hoạt qua annotation:
 *  - @Cacheable   : Đọc cache, nếu miss thì query DB rồi lưu vào cache
 *  - @CacheEvict  : Xóa cache khi dữ liệu thay đổi (tạo/sửa/xóa route/trip)
 * ╚══════════════════════════════════════════════════════════╝
 */
@Configuration // Đây là class cấu hình — Spring xử lý các @Bean bên trong
public class RedisConfig {

    /**
     * Cấu hình ObjectMapper để serialize/deserialize đúng các kiểu thời gian Java 8
     *
     * Vấn đề: Jackson mặc định không biết cách serialize LocalDate, LocalTime...
     * Giải pháp:
     * - registerModule(JavaTimeModule): thêm hỗ trợ Java 8 Date/Time API
     * - disable(WRITE_DATES_AS_TIMESTAMPS): lưu dạng ISO string "2024-07-09"
     *   thay vì số timestamp [2024, 7, 9] — dễ đọc và parse hơn
     */
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule()); // Hỗ trợ LocalDate, LocalTime, LocalDateTime
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS); // Dùng ISO format thay vì mảng số
        return mapper;
    }

    /**
     * Cấu hình RedisCacheManager — trung tâm quản lý toàn bộ cache
     *
     * Mỗi cache name (routes, trips) có thể có TTL khác nhau.
     * RedisConnectionFactory: Spring Boot tự tạo từ cấu hình redis trong application.yml
     */
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // Serializer: chuyển Java object → JSON khi ghi vào Redis
        //             chuyển JSON → Java object khi đọc từ Redis
        GenericJackson2JsonRedisSerializer serializer =
                new GenericJackson2JsonRedisSerializer(objectMapper());

        // Cấu hình mặc định áp dụng cho mọi cache (nếu không có config riêng)
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))  // TTL mặc định: 10 phút
                // Key lưu dạng String: "routes::all", "trips::HàNội-ĐàNẵng-2024-07-09"
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                // Value lưu dạng JSON trong Redis
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(serializer))
                .disableCachingNullValues(); // Không cache kết quả null — tránh cache poisoning

        // Cấu hình TTL riêng cho từng cache name
        Map<String, RedisCacheConfiguration> cacheConfigs = new HashMap<>();

        // Cache tuyến đường: 30 phút vì tuyến ít khi thay đổi
        cacheConfigs.put("routes", defaultConfig.entryTtl(Duration.ofMinutes(30)));

        // Cache kết quả tìm chuyến: 5 phút vì ghế trống có thể thay đổi liên tục
        cacheConfigs.put("trips", defaultConfig.entryTtl(Duration.ofMinutes(5)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)                    // Áp dụng config mặc định
                .withInitialCacheConfigurations(cacheConfigs)    // Ghi đè TTL cho routes + trips
                .build();
    }
}

