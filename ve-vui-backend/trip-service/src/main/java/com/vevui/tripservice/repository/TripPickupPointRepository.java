package com.vevui.tripservice.repository;

import com.vevui.tripservice.entity.TripPickupPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TripPickupPointRepository extends JpaRepository<TripPickupPoint, Long> {
    List<TripPickupPoint> findByTripId(Long tripId);
    List<TripPickupPoint> findByTripIdAndRole(Long tripId, TripPickupPoint.PointRole role);
    void deleteByTripId(Long tripId);
    void deleteByTripIdAndRole(Long tripId, TripPickupPoint.PointRole role);
}