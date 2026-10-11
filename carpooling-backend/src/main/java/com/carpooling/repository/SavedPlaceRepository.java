package com.carpooling.repository;

import com.carpooling.model.SavedPlace;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedPlaceRepository extends JpaRepository<SavedPlace, Long> {

    List<SavedPlace> findByUserIdOrderByCreatedAtAsc(Long userId);

    List<SavedPlace> findByUserIdAndLabelIgnoreCase(Long userId, String label);
}