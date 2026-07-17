package com.vevui.tripservice.repository; // Package chứa các Repository

import com.vevui.tripservice.entity.Bus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * BusRepository — Tầng truy cập bảng `buses`
 */
@Repository
public interface BusRepository extends JpaRepository<Bus, Long> {

    // Lấy danh sách xe theo trạng thái (ACTIVE, MAINTENANCE, INACTIVE)
    // Spring tự sinh: SELECT * FROM buses WHERE status = ?
    List<Bus> findByStatus(Bus.Status status);

    // Kiểm tra biển số xe có bị trùng không — trả về true/false
    // Spring tự sinh: SELECT COUNT(*) > 0 FROM buses WHERE plate_number = ?
    boolean existsByPlateNumber(String plateNumber);

    /**
     * Tìm kiếm xe theo từ khóa cho admin
     * Tìm trong: biển số, tên xe
     * LOWER(): không phân biệt hoa/thường
     */
    @Query("SELECT b FROM Bus b WHERE LOWER(b.plateNumber) LIKE %:q% OR LOWER(b.name) LIKE %:q%")
    List<Bus> searchByKeyword(@Param("q") String q);
}

