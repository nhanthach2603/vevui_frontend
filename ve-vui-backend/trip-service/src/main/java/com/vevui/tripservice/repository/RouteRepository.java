package com.vevui.tripservice.repository; // Package chứa các Repository

import com.vevui.tripservice.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * RouteRepository — Tầng truy cập bảng `routes`
 * Spring Data JPA tự sinh SQL dựa theo tên method.
 */
@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {

    // Lấy tất cả tuyến đang hoạt động (active = true)
    // Spring tự sinh: SELECT * FROM routes WHERE active = true
    List<Route> findByActiveTrue();

    // Lấy các tuyến phổ biến đang hoạt động — hiển thị trang chủ
    // Spring tự sinh: SELECT * FROM routes WHERE popular = true AND active = true
    List<Route> findByPopularTrueAndActiveTrue();

    // Tìm tuyến theo điểm đi + điểm đến (đang active)
    // Spring tự sinh: SELECT * FROM routes WHERE from_city = ? AND to_city = ? AND active = true
    List<Route> findByFromCityAndToCityAndActiveTrue(String fromCity, String toCity);
}

