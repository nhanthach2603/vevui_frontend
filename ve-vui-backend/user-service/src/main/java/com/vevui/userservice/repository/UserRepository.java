package com.vevui.userservice.repository;

import com.vevui.userservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    Optional<User> findByRefreshToken(String refreshToken);

    @Query("SELECT u FROM User u WHERE LOWER(u.fullName) LIKE %:q% OR LOWER(u.email) LIKE %:q% OR u.phone LIKE %:q%")
    List<User> searchByKeyword(@Param("q") String q);
}
