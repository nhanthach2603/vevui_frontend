package com.vevui.orderservice.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vevui.orderservice.dto.OrderDto;
import com.vevui.orderservice.dto.SeatLockDto;
import com.vevui.orderservice.entity.Coupon;
import com.vevui.orderservice.entity.Ticket;
import com.vevui.orderservice.feign.TripServiceClient;
import com.vevui.orderservice.kafka.BookingEventProducer;
import com.vevui.orderservice.repository.CouponRepository;
import com.vevui.orderservice.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final TicketRepository ticketRepository;
    private final CouponRepository couponRepository;
    private final TripServiceClient tripServiceClient;
    private final BookingEventProducer bookingEventProducer;
    private final ObjectMapper objectMapper;

    // ── Ticket Operations ──

    @Transactional
    public OrderDto.TicketResponse createTicket(OrderDto.CreateTicketRequest req) {
        log.info("Creating ticket for trip {} seats {}", req.getTripId(), req.getSeats());

        // 1. Lock seats via Feign (synchronous call to trip-service)
        SeatLockDto.SeatLockResponse lockResult = tripServiceClient.lockSeats(
            req.getTripId(), req.getSeats());

        if (!lockResult.isSuccess()) {
            throw new IllegalStateException("Không thể đặt ghế: " + lockResult.getMessage());
        }

        // 2. Apply coupon if provided
        BigDecimal finalPrice = req.getTotalPrice();
        if (req.getCouponCode() != null && !req.getCouponCode().isBlank()) {
            OrderDto.CouponResponse couponResp = applyCoupon(
                new OrderDto.CouponRequest() {{
                    setCode(req.getCouponCode());
                    setOriginalPrice(req.getTotalPrice());
                }});
            if (couponResp.isValid()) {
                finalPrice = couponResp.getFinalPrice();
            }
        }

        // 3. Generate ticket ID
        String ticketId = generateTicketId();

        // 4. Create ticket
        Ticket ticket = Ticket.builder()
                .id(ticketId)
                .tripId(req.getTripId())
                .customerId(req.getCustomerId())
                .customerName(req.getCustomerName())
                .phone(req.getPhone())
                .email(req.getEmail())
                .seats(serializeSeats(req.getSeats()))
                .pickupPointId(req.getPickupPointId())
                .dropoffPointId(req.getDropoffPointId())
                .totalPrice(finalPrice)
                .paymentMethod(req.getPaymentMethod())
                .status(Ticket.Status.CONFIRMED)
                .fromCity(req.getFromCity())
                .toCity(req.getToCity())
                .tripDate(req.getTripDate())
                .departureTime(req.getDepartureTime())
                .arrivalTime(req.getArrivalTime())
                .build();

        Ticket saved = ticketRepository.save(ticket);
        log.info("✅ Ticket created: {}", ticketId);

        // 5. Publish Kafka event (async notification)
        bookingEventProducer.sendBookingConfirmed(saved);

        return toResponse(saved);
    }

    public OrderDto.TicketResponse getTicketById(String id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy vé: " + id));
        return toResponse(ticket);
    }

    public List<OrderDto.TicketResponse> searchByPhone(String phone) {
        return ticketRepository.findByPhoneOrderByBookedAtDesc(phone)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<OrderDto.TicketResponse> getMyTickets(Long customerId) {
        return ticketRepository.findByCustomerIdOrderByBookedAtDesc(customerId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public Page<OrderDto.TicketResponse> getAllTickets(Pageable pageable) {
        return ticketRepository.findAllByOrderByBookedAtDesc(pageable).map(this::toResponse);
    }

    public OrderDto.StatsResponse getStats() {
        List<Ticket> all = ticketRepository.findAll();
        String today = LocalDate.now().toString();

        long confirmed = all.stream().filter(t -> t.getStatus() == Ticket.Status.CONFIRMED).count();
        long cancelled = all.stream().filter(t -> t.getStatus() == Ticket.Status.CANCELLED).count();

        BigDecimal totalRevenue = all.stream()
                .filter(t -> t.getStatus() == Ticket.Status.CONFIRMED)
                .map(Ticket::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Ticket> todayList = all.stream()
                .filter(t -> t.getTripDate() != null && t.getTripDate().equals(today))
                .collect(Collectors.toList());
        long todayTickets = todayList.size();
        BigDecimal todayRevenue = todayList.stream()
                .filter(t -> t.getStatus() == Ticket.Status.CONFIRMED)
                .map(Ticket::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return OrderDto.StatsResponse.builder()
                .totalTickets(all.size())
                .confirmedTickets(confirmed)
                .cancelledTickets(cancelled)
                .totalRevenue(totalRevenue)
                .todayTickets(todayTickets)
                .todayRevenue(todayRevenue)
                .build();
    }

    @Transactional
    public OrderDto.TicketResponse cancelTicket(String id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy vé: " + id));

        if (ticket.getStatus() == Ticket.Status.CANCELLED) {
            throw new IllegalStateException("Vé đã bị hủy trước đó");
        }

        ticket.setStatus(Ticket.Status.CANCELLED);
        log.info("Ticket {} cancelled", id);
        return toResponse(ticketRepository.save(ticket));
    }

    // ── Coupon Operations ──

    public OrderDto.CouponResponse applyCoupon(OrderDto.CouponRequest req) {
        return couponRepository.findByCodeAndActiveTrue(req.getCode().toUpperCase())
                .map(coupon -> {
                    if (coupon.getUsedCount() >= coupon.getMaxUses()) {
                        return OrderDto.CouponResponse.builder()
                                .valid(false)
                                .message("Mã giảm giá đã hết lượt sử dụng")
                                .build();
                    }
                    BigDecimal discountAmt = req.getOriginalPrice()
                            .multiply(BigDecimal.valueOf(coupon.getDiscountRate()))
                            .setScale(0, RoundingMode.HALF_UP);
                    BigDecimal finalPrice = req.getOriginalPrice().subtract(discountAmt);

                    return OrderDto.CouponResponse.builder()
                            .valid(true)
                            .code(coupon.getCode())
                            .discountRate(coupon.getDiscountRate())
                            .discountAmount(discountAmt)
                            .finalPrice(finalPrice)
                            .message("Áp dụng mã giảm giá thành công!")
                            .build();
                })
                .orElse(OrderDto.CouponResponse.builder()
                        .valid(false)
                        .message("Mã giảm giá không hợp lệ hoặc đã hết hạn")
                        .build());
    }

    // ── Payment Processing (Mock) ──

    public OrderDto.PaymentResponse processPayment(OrderDto.PaymentRequest req) {
        log.info("Processing payment for ticket {} via {}", req.getTicketId(), req.getPaymentMethod());
        // In real system: integrate with MoMo, VNPay, ZaloPay API
        // For demo: simulate successful payment
        String transactionId = "TXN" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();

        return OrderDto.PaymentResponse.builder()
                .success(true)
                .transactionId(transactionId)
                .message("Thanh toán thành công qua " + req.getPaymentMethod())
                .build();
    }

    // ── Private Helpers ──

    private String generateTicketId() {
        String ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmm"));
        String rnd = UUID.randomUUID().toString().replace("-", "").substring(0, 4).toUpperCase();
        return "VV" + ts + rnd;
    }

    private String serializeSeats(List<String> seats) {
        try {
            return objectMapper.writeValueAsString(seats);
        } catch (Exception e) {
            return "[]";
        }
    }

    private List<String> parseSeats(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private OrderDto.TicketResponse toResponse(Ticket t) {
        return OrderDto.TicketResponse.builder()
                .id(t.getId())
                .tripId(t.getTripId())
                .customerId(t.getCustomerId())
                .customerName(t.getCustomerName())
                .phone(t.getPhone())
                .email(t.getEmail())
                .seats(parseSeats(t.getSeats()))
                .pickupPointId(t.getPickupPointId())
                .dropoffPointId(t.getDropoffPointId())
                .totalPrice(t.getTotalPrice())
                .paymentMethod(t.getPaymentMethod())
                .status(t.getStatus().name())
                .fromCity(t.getFromCity())
                .toCity(t.getToCity())
                .tripDate(t.getTripDate())
                .departureTime(t.getDepartureTime())
                .arrivalTime(t.getArrivalTime())
                .bookedAt(t.getBookedAt() != null ? t.getBookedAt().toString() : null)
                .build();
    }
}
