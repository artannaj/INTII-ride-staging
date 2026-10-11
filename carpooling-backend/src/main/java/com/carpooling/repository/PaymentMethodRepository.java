package com.carpooling.repository;

import com.carpooling.model.PaymentMethod;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {

    List<PaymentMethod> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<PaymentMethod> findByUserIdAndIsDefaultTrue(Long userId);

    List<PaymentMethod> findByUserIdAndType(Long userId, PaymentMethod.Type type);
}