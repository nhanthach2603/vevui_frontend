package com.vevui.userservice.repository;

import com.vevui.userservice.entity.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<Otp, Long> {

    Optional<Otp> findTopByEmailAndPurposeOrderByCreatedAtDesc(String email, String purpose);

    Optional<Otp> findTopByEmailOrderByCreatedAtDesc(String email);

    void deleteAllByEmailAndPurpose(String email, String purpose);

    int deleteByExpiresAtBeforeOrUsedTrue(LocalDateTime now);
}
