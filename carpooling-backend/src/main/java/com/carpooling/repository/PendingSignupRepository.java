package com.carpooling.repository;

import com.carpooling.model.PendingSignup;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PendingSignupRepository extends JpaRepository<PendingSignup, Long> {

    Optional<PendingSignup> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByPhone(String phone);

    void deleteByEmail(String email);
}
