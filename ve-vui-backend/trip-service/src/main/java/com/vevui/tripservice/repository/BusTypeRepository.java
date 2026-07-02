package com.vevui.tripservice.repository;

import com.vevui.tripservice.entity.BusType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BusTypeRepository extends JpaRepository<BusType, Long> {
    Optional<BusType> findByCode(String code);
}
