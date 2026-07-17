package com.vevui.tripservice.repository;

import com.vevui.tripservice.entity.City;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CityRepository extends JpaRepository<City, Long> {
    List<City> findByActiveTrueOrderByName();
    List<City> findAllByOrderByName();
    boolean existsByNameIgnoreCaseAndActiveTrue(String name);
}
