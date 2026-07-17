package com.vevui.notificationservice.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingEventConsumer {

    private final ObjectMapper objectMapper;
    private final JavaMailSender mailSender;

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

            log.info("[Kafka Consumer] Received booking-confirmed event:");
            log.info("   Ticket ID    : {}", ticketId);
            log.info("   Customer     : {} <{}>", customerName, email);
            log.info("   Route        : {} -> {}", fromCity, toCity);
            log.info("   Date/Time    : {} at {}", tripDate, departureTime);
            log.info("   Total Price  : {} VND", totalPrice);

            sendBookingConfirmationEmail(ticketId, customerName, email, fromCity, toCity,
                    tripDate, departureTime, totalPrice);

        } catch (Exception e) {
            log.error("Failed to process booking event: {}", e.getMessage(), e);
        }
    }

    private void sendBookingConfirmationEmail(String ticketId, String customerName, String email,
            String fromCity, String toCity, String tripDate, String departureTime, Object totalPrice) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("Vé Vui <noreply@vevui.vn>");
            helper.setTo(email);
            helper.setSubject("Xác nhận đặt vé thành công — Vé Vui");

            String htmlBody = """
                <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
                  <h2 style="color:#2563eb;text-align:center;margin-bottom:4px;">Vé Vui</h2>
                  <p style="text-align:center;color:#6b7280;margin-top:0;">Xác nhận đặt vé thành công</p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;"/>

                  <p>Xin chào <strong>%s</strong>,</p>
                  <p>Bạn đã đặt vé thành công. Dưới đây là thông tin chi tiết:</p>

                  <div style="background:#f0f9ff;border-radius:8px;padding:16px;margin:16px 0;">
                    <table style="width:100%%;border-collapse:collapse;font-size:14px;">
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;">Mã vé</td>
                        <td style="padding:6px 0;font-weight:bold;color:#2563eb;">%s</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;">Tuyến đường</td>
                        <td style="padding:6px 0;font-weight:bold;">%s → %s</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;">Ngày đi</td>
                        <td style="padding:6px 0;font-weight:bold;">%s</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;">Giờ khởi hành</td>
                        <td style="padding:6px 0;font-weight:bold;">%s</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;">Tổng tiền</td>
                        <td style="padding:6px 0;font-weight:bold;color:#dc2626;font-size:16px;">%s VNĐ</td>
                      </tr>
                    </table>
                  </div>

                  <p style="color:#6b7280;font-size:14px;">Vui lòng có mặt trước giờ khởi hành ít nhất <strong>15 phút</strong> tại bến xe.</p>
                  <p style="color:#6b7280;font-size:14px;">Nếu cần hỗ trợ, liên hệ: <a href="mailto:support@vevui.vn" style="color:#2563eb;">support@vevui.vn</a></p>

                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
                  <p style="color:#9ca3af;font-size:12px;text-align:center;">© 2026 Vé Vui — Nền tảng đặt vé xe trực tuyến</p>
                </div>
                """.formatted(customerName, ticketId, fromCity, toCity, tripDate, departureTime, totalPrice);

            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Booking confirmation email sent to {} — ticketId={}", email, ticketId);
        } catch (MessagingException e) {
            log.error("Failed to send booking email to {}: {}", email, e.getMessage());
        }
    }
}
