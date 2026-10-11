package com.carpooling.repository;

import com.carpooling.model.OtpCode;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {

    Optional<OtpCode> findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(
            String email, OtpCode.Purpose purpose);
}