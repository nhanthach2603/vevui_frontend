package com.vevui.tripservice.repository;

import com.vevui.tripservice.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {

    @Query("SELECT t FROM Trip t WHERE t.route.fromCity = :fromCity " +
           "AND t.route.toCity = :toCity AND t.tripDate = :date " +
           "AND t.status = 'SCHEDULED' ORDER BY t.departureTime")
    List<Trip> searchTrips(String fromCity, String toCity, LocalDate date);

    List<Trip> findByRouteIdAndTripDateOrderByDepartureTime(Long routeId, LocalDate date);

    @Modifying
    @Transactional
    @Query("UPDATE Trip t SET t.bookedSeats = :bookedSeats, " +
           "t.availableSeats = t.availableSeats - :count WHERE t.id = :id")
    void lockSeats(Long id, String bookedSeats, int count);
}
