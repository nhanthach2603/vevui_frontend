package com.vevui.tripservice.repository; // Package chứa các Repository — tầng truy cập DB

import com.vevui.tripservice.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository; // CRUD sẵn có
import org.springframework.data.jpa.repository.Modifying;     // Dùng cho câu UPDATE/DELETE bằng @Query
import org.springframework.data.jpa.repository.Query;         // Viết câu JPQL tùy chỉnh
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional; // Bắt buộc khi dùng @Modifying

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

/**
 * ╔══════════════════════════════════════════════════════════╗
 *  TripRepository — Tầng truy cập bảng `trips`
 *
 *  Đây là repository quan trọng nhất của Trip Service.
 *  Có các query đặc biệt:
 *  1. searchTrips  : Tìm chuyến theo điều kiện (route + ngày + trạng thái)
 *  2. lockSeats    : Cập nhật danh sách ghế đã đặt (atomic UPDATE)
 *  3. searchByKeyword: Tìm kiếm full-text cho admin
 * ╚══════════════════════════════════════════════════════════╝
 */
@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {

    /**
     * Tìm tất cả chuyến đi phù hợp theo tuyến + ngày + trạng thái SCHEDULED
     *
     * Dùng LOWER() để không phân biệt hoa/thường
     * Dùng LIKE thay vì = để xử lý encoding dấu tiếng Việt
     * ORDER BY t.departureTime: sắp xếp chuyến sớm nhất lên đầu
     */
    @Query("SELECT t FROM Trip t WHERE LOWER(t.route.fromCity) LIKE LOWER(CONCAT('%', :fromCity, '%')) " +
           "AND LOWER(t.route.toCity) LIKE LOWER(CONCAT('%', :toCity, '%')) AND t.tripDate = :date " +
           "AND t.status = 'SCHEDULED' AND t.route.active = true ORDER BY t.departureTime")
    List<Trip> searchTrips(String fromCity, String toCity, LocalDate date);

    /**
     * Spring tự sinh: SELECT * FROM trips WHERE route_id = ? AND trip_date = ?
     *                  ORDER BY departure_time
     * Dùng khi cần tất cả chuyến của 1 tuyến trong ngày (không lọc theo status)
     */
    List<Trip> findByRouteIdAndTripDateOrderByDepartureTime(Long routeId, LocalDate date);

    /**
     * Khóa ghế — cập nhật atomically danh sách ghế và số ghế còn trống
     *
     * @Modifying : Báo Spring đây là câu UPDATE (không phải SELECT)
     * @Transactional: Đảm bảo toàn bộ thao tác trong cùng 1 transaction
     *                 Nếu lỗi giữa chừng → rollback, tránh trừ availableSeats mà không cập nhật bookedSeats
     *
     * t.availableSeats = t.availableSeats - :count
     * → Dùng phép trừ trực tiếp trong SQL (atomic) để tránh race condition
     *   so với: đọc ra Java → trừ → ghi lại (có thể bị conflict khi nhiều người đặt cùng lúc)
     */
    @Modifying
    @Transactional
    @Query("UPDATE Trip t SET t.bookedSeats = :bookedSeats, " +
           "t.availableSeats = t.availableSeats - :count WHERE t.id = :id")
    void lockSeats(Long id, String bookedSeats, int count);

    /**
     * Tìm kiếm chuyến đi cho admin theo từ khóa (tên thành phố, ngày)
     * LOWER(): không phân biệt hoa/thường
     * CAST(t.tripDate AS string): chuyển LocalDate → String để tìm theo ngày
     */
    @Query("SELECT t FROM Trip t WHERE LOWER(t.route.fromCity) LIKE %:q% " +
           "OR LOWER(t.route.toCity) LIKE %:q% OR CAST(t.tripDate AS string) LIKE %:q%")
    List<Trip> searchByKeyword(String q);

    /**
     * Lấy tất cả chuyến sắp khởi hành (SCHEDULED hoặc DEPARTED), sắp xếp theo ngày + giờ
     * Dùng cho trang Lịch trình công khai
     */
    @Query("SELECT t FROM Trip t WHERE t.status IN ('SCHEDULED', 'DEPARTED') " +
           "AND t.route.active = true ORDER BY t.tripDate ASC, t.departureTime ASC")
    List<Trip> findUpcomingTrips();

    /**
     * Đếm số chuyến theo trạng thái — dùng trong getTripStats()
     * Spring tự sinh: SELECT COUNT(*) FROM trips WHERE status = ?
     */
    long countByStatus(Trip.Status status);

    long countByBusId(Long busId);

    List<Trip> findByTripDateAndStatusIn(LocalDate date, List<Trip.Status> statuses);

    @Query("SELECT t FROM Trip t WHERE t.status = 'COMPLETED' " +
           "AND (LOWER(t.route.fromCity) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(t.route.toCity) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR CAST(t.tripDate AS string) LIKE CONCAT('%', :q, '%')) " +
           "ORDER BY t.tripDate DESC, t.departureTime DESC")
    List<Trip> searchCompletedTrips(String q);

    List<Trip> findByStatusOrderByTripDateDescDepartureTimeDesc(Trip.Status status);

    @Query("SELECT t FROM Trip t WHERE t.status = 'COMPLETED' AND t.tripDate = :date " +
           "ORDER BY t.departureTime DESC")
    List<Trip> findCompletedTripsByDate(LocalDate date);

    @Query("SELECT t FROM Trip t WHERE t.status IN ('SCHEDULED', 'DEPARTED') " +
           "AND t.route.active = true ORDER BY t.tripDate DESC, t.departureTime DESC")
    List<Trip> findActiveTrips();

    Page<Trip> findByStatusNot(Trip.Status status, Pageable pageable);

    @Query("SELECT t FROM Trip t WHERE LOWER(t.route.fromCity) LIKE LOWER(CONCAT('%', :from, '%')) " +
           "AND LOWER(t.route.toCity) LIKE LOWER(CONCAT('%', :to, '%')) " +
           "AND t.tripDate BETWEEN :start AND :end AND t.status <> :status " +
           "ORDER BY t.tripDate ASC, t.departureTime ASC")
    List<Trip> findByRouteFromCityAndRouteToCityAndTripDateBetweenAndStatusNot(
            String from, String to, LocalDate start, LocalDate end, Trip.Status status);

    List<Trip> findByRouteIdInAndTripDateBetweenAndStatusNot(
            List<Long> routeIds, LocalDate start, LocalDate end, Trip.Status status);
}

