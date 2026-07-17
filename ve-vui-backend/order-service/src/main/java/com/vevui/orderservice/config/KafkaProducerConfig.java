package com.vevui.orderservice.config; // Package cấu hình

import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;

import java.util.HashMap;
import java.util.Map;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  KafkaProducerConfig — Cấu hình Kafka Producer
 *
 *  Kafka Producer là thành phần gửi tin nhắn (event) đến Kafka Broker.
 *  Order Service dùng Kafka để gửi sự kiện "booking-confirmed"
 *  khi khách đặt vé thành công.
 *
 *  Tại sao dùng Kafka?
 *  → Order Service không cần biết ai lắng nghe sự kiện
 *  → Notification Service, Analytics Service... có thể subscribed
 *  → Tách biệt: Order chỉ "fire and forget", không chờ response
 *
 *  Cấu hình quan trọng:
 *  - bootstrap-servers : địa chỉ Kafka Broker (mặc định localhost:9092)
 *  - acks=all          : Kafka xác nhận khi TẤT CẢ replicas đã ghi
 *  - retries=3         : tự động gửi lại tối đa 3 lần nếu lỗi
 *  - idempotence=true  : tránh gửi trùng (mỗi message có sequence number)
 * ╚══════════════════════════════════════════════════════════╝
 */
@Configuration
public class KafkaProducerConfig {

    /**
     * Địa chỉ Kafka Broker — đọc từ application.yml
     * Ví dụ: "localhost:9092" hoặc "kafka:9092" trong Docker
     */
    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    /**
     * ProducerFactory — Factory tạo Kafka Producer
     *
     * Mỗi config là một setting của Kafka Producer:
     * - BOOTSTRAP_SERVERS  : nơi kết nối đến Kafka
     * - KEY_SERIALIZER     : serialize key (String → bytes) — dùng để partition
     * - VALUE_SERIALIZER   : serialize value (String → bytes) — nội dung event
     * - ACKS               : độ tin cậy ghi (all = chờ tất cả replicas ghi xong)
     * - RETRIES            : số lần thử lại khi lỗi mạng
     * - ENABLE_IDEMPOTENCE : bật chế độ idempotent — tránh gửi trùng message
     */
    @Bean
    public ProducerFactory<String, String> producerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.ACKS_CONFIG, "all");
        config.put(ProducerConfig.RETRIES_CONFIG, 3);
        config.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        return new DefaultKafkaProducerFactory<>(config);
    }

    /**
     * KafkaTemplate — Template便捷方法 gửi tin nhắn đến Kafka
     *
     * Sử dụng: kafkaTemplate.send(topic, key, value)
     * - topic  : tên topic Kafka (ví dụ: "booking-confirmed")
     * - key    : khóa phân đoạn (ticketId — đảm bảo cùng 1 vé vào cùng 1 partition)
     * - value  : nội dung JSON của sự kiện
     */
    @Bean
    public KafkaTemplate<String, String> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}
