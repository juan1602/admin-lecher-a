package com.smartlech.adminlecheria.repository;

import com.smartlech.adminlecheria.entity.Quincena;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface QuincenaRepository extends JpaRepository<Quincena, Long> {
    Optional<Quincena> findByCerradaFalse();
}
