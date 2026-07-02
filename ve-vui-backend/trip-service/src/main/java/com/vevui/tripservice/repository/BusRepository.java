package com.vevui.tripservice.repository;

import com.vevui.tripservice.entity.Bus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusRepository extends JpaRepository<Bus, Long> {
    List<Bus> findByStatus(Bus.Status status);
    boolean existsByPlateNumber(String plateNumber);
}
