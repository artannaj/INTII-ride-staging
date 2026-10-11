package com.carpooling.repository;

import com.carpooling.model.Referral;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReferralRepository extends JpaRepository<Referral, Long> {

    List<Referral> findByReferrerIdOrderByCreatedAtDesc(Long referrerId);

    Optional<Referral> findByReferredEmail(String referredEmail);

    long countByReferrerIdAndStatus(Long referrerId, Referral.Status status);
}