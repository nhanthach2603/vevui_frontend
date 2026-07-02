package com.vevui.tripservice.repository;

import com.vevui.tripservice.entity.PickupPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PickupPointRepository extends JpaRepository<PickupPoint, Long> {
    List<PickupPoint> findByCityAndActiveTrueOrderByTimeOffset(String city);
}
