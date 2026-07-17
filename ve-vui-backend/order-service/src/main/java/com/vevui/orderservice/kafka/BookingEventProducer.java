package com.vevui.orderservice.kafka; // Package chứa Kafka Producer/Consumer

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vevui.orderservice.entity.Ticket;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  BookingEventProducer — Gửi sự kiện "Đặt vé thành công"
 *
 *  Sau khi tạo vé thành công, Order Service gửi 1 event đến Kafka
 *  → Notification Service lắng nghe → gửi email/SMS cho khách
 *  → Analytics Service lắng nghe → cập nhật thống kê
 *  → Inventory Service lắng nghe → cập nhật số ghế (nếu cần)
 *
 *  Topic: "booking-confirmed"
 *  Key: ticketId (đảm bảo cùng 1 vé vào cùng 1 Kafka partition)
 *  Value: JSON chứa thông tin vé
 *
 *  Tại sao dùng Kafka thay vì gọi trực tiếp?
 *  → Decoupling: Order Service không cần biết ai lắng nghe
 *  → Reliable: Kafka lưu message, nếu consumer chết → message không mất
 *  → Scalable: nhiều consumer instances cùng xử lý
 * ╚══════════════════════════════════════════════════════════╝
 */
@Slf4j          // Logger
@Service        // Spring Bean kiểu Service
@RequiredArgsConstructor // Inject KafkaTemplate + ObjectMapper
public class BookingEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate; // Gửi tin nhắn Kafka
    private final ObjectMapper objectMapper; // Serialize Java object → JSON

    /** Tên topic Kafka — phải trùng với consumer ở service khác */
    public static final String BOOKING_CONFIRMED_TOPIC = "booking-confirmed";

    /**
     * Gửi sự kiện "booking-confirmed" đến Kafka
     *
     * @param ticket : vé vừa tạo thành công
     *
     * Logic:
     * 1. Tạo Map chứa thông tin vé (các field cần thiết cho consumer)
     * 2. Serialize Map → JSON string
     * 3. Gửi đến Kafka topic "booking-confirmed" với key = ticketId
     *
     * Nếu gửi lỗi → chỉ log.error(), không throw exception
     * → Vé vẫn được lưu DB, không rollback vì lỗi Kafka
     */
    public void sendBookingConfirmed(Ticket ticket) {
        try {
            // 1. Tạo event payload — chỉ gửi các field cần thiết
            Map<String, Object> event = new HashMap<>();
            event.put("ticketId", ticket.getId());
            event.put("customerName", ticket.getCustomerName());
            event.put("email", ticket.getEmail());
            event.put("phone", ticket.getPhone());
            event.put("seats", ticket.getSeats());
            event.put("fromCity", ticket.getFromCity());
            event.put("toCity", ticket.getToCity());
            event.put("tripDate", ticket.getTripDate());
            event.put("departureTime", ticket.getDepartureTime());
            event.put("totalPrice", ticket.getTotalPrice());
            event.put("paymentMethod", ticket.getPaymentMethod());
            event.put("bookedAt", ticket.getBookedAt() != null
                ? ticket.getBookedAt().toString() : "");

            // 2. Serialize Map → JSON string
            String payload = objectMapper.writeValueAsString(event);

            // 3. Gửi đến Kafka
            //    - topic: "booking-confirmed"
            //    - key: ticketId (dùng để partition — cùng ticketId vào cùng partition)
            //    - value: JSON payload
            kafkaTemplate.send(BOOKING_CONFIRMED_TOPIC, ticket.getId(), payload);
            log.info("📨 Sent booking-confirmed event for ticket: {}", ticket.getId());

        } catch (Exception e) {
            // Lỗi Kafka KHÔNG được làm crash Order Service
            // Vé đã lưu DB → khách vẫn nhận được vé
            // Kafka event chỉ là async notification (best-effort)
            log.error("Failed to send Kafka event for ticket {}: {}", ticket.getId(), e.getMessage());
        }
    }
}
