package com.vevui.notificationservice.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingEventConsumer {

    private final ObjectMapper objectMapper;

    @KafkaListener(
        topics = "booking-confirmed",
        groupId = "notification-service-group",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleBookingConfirmed(String message) {
        try {
            Map<String, Object> event = objectMapper.readValue(message, Map.class);

            String ticketId = (String) event.get("ticketId");
            String customerName = (String) event.get("customerName");
            String email = (String) event.get("email");
            String fromCity = (String) event.get("fromCity");
            String toCity = (String) event.get("toCity");
            String tripDate = (String) event.get("tripDate");
            String departureTime = (String) event.get("departureTime");
            Object totalPrice = event.get("totalPrice");

            log.info("📧 [Kafka Consumer] Received booking-confirmed event:");
            log.info("   ┌─ Ticket ID    : {}", ticketId);
            log.info("   ├─ Customer     : {} <{}>", customerName, email);
            log.info("   ├─ Route        : {} → {}", fromCity, toCity);
            log.info("   ├─ Date/Time    : {} at {}", tripDate, departureTime);
            log.info("   └─ Total Price  : {} VNĐ", totalPrice);

            // Simulate sending email
            sendEmailNotification(ticketId, customerName, email, fromCity, toCity,
                    tripDate, departureTime, totalPrice);

        } catch (Exception e) {
            log.error("❌ Failed to process booking event: {}", e.getMessage(), e);
        }
    }

    private void sendEmailNotification(String ticketId, String customerName, String email,
            String fromCity, String toCity, String tripDate, String departureTime, Object totalPrice) {

        // In production: use JavaMailSender or SMTP to send actual email
        // For demo: log the email content
        String emailBody = String.format("""
                ═══════════════════════════════════════════════════
                🎫  VÉ VUI — XÁC NHẬN ĐẶT VÉ THÀNH CÔNG!
                ═══════════════════════════════════════════════════
                Kính gửi: %s
                Email: %s
                
                Mã vé của bạn: %s
                
                📍 Tuyến đường : %s → %s
                📅 Ngày đi     : %s
                ⏰ Giờ khởi hành: %s
                💰 Tổng tiền   : %s VNĐ
                
                Vui lòng có mặt trước giờ khởi hành ít nhất 15 phút.
                Cảm ơn bạn đã sử dụng dịch vụ Vé Vui! 🚌
                ═══════════════════════════════════════════════════
                """,
                customerName, email, ticketId,
                fromCity, toCity, tripDate, departureTime, totalPrice
        );

        log.info("\n{}", emailBody);
        log.info("✅ Email notification sent to: {}", email);
    }
}
