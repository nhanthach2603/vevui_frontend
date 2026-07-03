package com.vevui.tripservice.repository;

import com.vevui.tripservice.entity.Bus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusRepository extends JpaRepository<Bus, Long> {
    List<Bus> findByStatus(Bus.Status status);
    boolean existsByPlateNumber(String plateNumber);

    @Query("SELECT b FROM Bus b WHERE LOWER(b.plateNumber) LIKE %:q% OR LOWER(b.name) LIKE %:q%")
    List<Bus> searchByKeyword(@Param("q") String q);
}
