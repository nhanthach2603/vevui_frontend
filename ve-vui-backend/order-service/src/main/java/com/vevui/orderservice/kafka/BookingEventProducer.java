package com.vevui.orderservice.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vevui.orderservice.entity.Ticket;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public static final String BOOKING_CONFIRMED_TOPIC = "booking-confirmed";

    public void sendBookingConfirmed(Ticket ticket) {
        try {
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

            String payload = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(BOOKING_CONFIRMED_TOPIC, ticket.getId(), payload);
            log.info("📨 Sent booking-confirmed event for ticket: {}", ticket.getId());

        } catch (Exception e) {
            log.error("Failed to send Kafka event for ticket {}: {}", ticket.getId(), e.getMessage());
        }
    }
}
