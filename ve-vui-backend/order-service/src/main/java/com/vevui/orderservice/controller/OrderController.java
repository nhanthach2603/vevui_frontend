package com.vevui.orderservice.controller;

import com.vevui.orderservice.dto.OrderDto;
import com.vevui.orderservice.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // ── Ticket Endpoints ──

    @PostMapping("/api/tickets")
    public ResponseEntity<OrderDto.TicketResponse> createTicket(
            @RequestBody OrderDto.CreateTicketRequest request) {
        log.info("POST /api/tickets for trip={}", request.getTripId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.createTicket(request));
    }

    @GetMapping("/api/tickets/{id}")
    public ResponseEntity<OrderDto.TicketResponse> getTicketById(@PathVariable String id) {
        return ResponseEntity.ok(orderService.getTicketById(id));
    }

    @GetMapping("/api/tickets/search")
    public ResponseEntity<List<OrderDto.TicketResponse>> searchTickets(
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) Long customerId) {
        if (phone != null) {
            return ResponseEntity.ok(orderService.searchByPhone(phone));
        } else if (customerId != null) {
            return ResponseEntity.ok(orderService.getMyTickets(customerId));
        }
        return ResponseEntity.badRequest().build();
    }

    @PutMapping("/api/tickets/{id}/cancel")
    public ResponseEntity<OrderDto.TicketResponse> cancelTicket(@PathVariable String id) {
        return ResponseEntity.ok(orderService.cancelTicket(id));
    }

    // ── Admin Endpoints ──

    @GetMapping("/api/admin/tickets")
    public ResponseEntity<Page<OrderDto.TicketResponse>> getAllTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(orderService.getAllTickets(PageRequest.of(page, size)));
    }

    // ── Payment Endpoints ──

    @PostMapping("/api/payment/process")
    public ResponseEntity<OrderDto.PaymentResponse> processPayment(
            @RequestBody OrderDto.PaymentRequest request) {
        return ResponseEntity.ok(orderService.processPayment(request));
    }

    @PostMapping("/api/payment/apply-coupon")
    public ResponseEntity<OrderDto.CouponResponse> applyCoupon(
            @RequestBody OrderDto.CouponRequest request) {
        return ResponseEntity.ok(orderService.applyCoupon(request));
    }

    // ── Error Handler ──

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<Map<String, String>> handleErrors(RuntimeException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
