package com.carpooling.repository;

import com.carpooling.model.Session;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionRepository extends JpaRepository<Session, Long> {

    List<Session> findByUserIdAndRevokedFalse(Long userId);

    List<Session> findByUserIdOrderByCreatedAtDesc(Long userId);
}