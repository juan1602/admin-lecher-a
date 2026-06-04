package com.smartlech.adminlecheria.repository;

import com.smartlech.adminlecheria.entity.Conductor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ConductorRepository extends JpaRepository<Conductor, Long> {
    List<Conductor> findByActivoTrue();
}
