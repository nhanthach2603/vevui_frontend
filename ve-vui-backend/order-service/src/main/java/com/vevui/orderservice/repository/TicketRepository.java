package com.vevui.orderservice.repository;

import com.vevui.orderservice.entity.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, String> {
    List<Ticket> findByPhoneOrderByBookedAtDesc(String phone);
    List<Ticket> findByEmailOrderByBookedAtDesc(String email);
    List<Ticket> findByCustomerIdOrderByBookedAtDesc(Long customerId);
    Page<Ticket> findAllByOrderByBookedAtDesc(Pageable pageable);

    @Query("SELECT t FROM Ticket t WHERE LOWER(t.customerName) LIKE %:q% OR t.phone LIKE %:q% OR LOWER(t.id) LIKE %:q%")
    List<Ticket> searchAdmin(@Param("q") String q);
}
