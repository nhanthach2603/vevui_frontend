package com.vevui.orderservice.repository; // Package chứa Repository — tầng truy cập DB

import com.vevui.orderservice.entity.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * TicketRepository — Tầng truy cập bảng `tickets` trong db_orders
 *
 * Kế thừa JpaRepository<Ticket, String>:
 * - Ticket: entity type
 * - String: ID type (Ticket.id là String, không phải Long)
 *
 * JpaRepository cung cấp sẵn:
 * - save(), findById(), findAll(), deleteById()...
 * - Phân trang: findAll(Pageable) → Page<Ticket>
 */
@Repository
public interface TicketRepository extends JpaRepository<Ticket, String> {

    /**
     * Tìm vé theo SĐT — hiển thị mới nhất trước
     * Spring tự sinh: SELECT * FROM tickets WHERE phone = ? ORDER BY booked_at DESC
     * Dùng cho: TicketLookupPage (user nhập SĐT tra cứu vé)
     */
    List<Ticket> findByPhoneOrderByBookedAtDesc(String phone);

    /**
     * Tìm vé theo email — hiển thị mới nhất trước
     * Spring tự sinh: SELECT * FROM tickets WHERE email = ? ORDER BY booked_at DESC
     */
    List<Ticket> findByEmailOrderByBookedAtDesc(String email);

    /**
     * Tìm vé theo customerId — vé của 1 khách hàng
     * Spring tự sinh: SELECT * FROM tickets WHERE customer_id = ? ORDER BY booked_at DESC
     * Dùng cho: ProfilePage (user xem lịch sử đặt vé)
     */
    List<Ticket> findByCustomerIdOrderByBookedAtDesc(Long customerId);

    /**
     * Lấy tất cả vé phân trang — hiển thị mới nhất trước
     * Dùng cho: Admin TicketsPage
     * Pageable chứa: page number, page size, sort
     */
    Page<Ticket> findAllByOrderByBookedAtDesc(Pageable pageable);

    /**
     * Tìm kiếm vé cho admin theo từ khóa
     * Tìm trong: tên khách hàng, SĐT, mã vé (id)
     * LOWER(): không phân biệt hoa/thường
     *
     * Dùng cho: Admin TicketsPage — thanh tìm kiếm
     */
    @Query("SELECT t FROM Ticket t WHERE LOWER(t.customerName) LIKE %:q% " +
           "OR t.phone LIKE %:q% OR LOWER(t.id) LIKE %:q%")
    List<Ticket> searchAdmin(@Param("q") String q);

    List<Ticket> findByTripIdOrderByBookedAtDesc(Long tripId);
}
