package com.vevui.tripservice.repository;

import com.vevui.tripservice.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {
    List<Route> findByActiveTrue();
    List<Route> findByPopularTrueAndActiveTrue();
    List<Route> findByFromCityAndToCityAndActiveTrue(String fromCity, String toCity);
}
