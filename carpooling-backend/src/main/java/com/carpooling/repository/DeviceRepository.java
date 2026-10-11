package com.carpooling.repository;

import com.carpooling.model.Device;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceRepository extends JpaRepository<Device, Long> {

    List<Device> findByUserIdOrderByLastActiveDesc(Long userId);

    List<Device> findByUserIdAndIsCurrentTrue(Long userId);
}