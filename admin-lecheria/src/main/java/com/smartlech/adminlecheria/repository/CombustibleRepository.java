package com.smartlech.adminlecheria.repository;

import com.smartlech.adminlecheria.entity.Combustible;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CombustibleRepository extends JpaRepository<Combustible, Long> {
    List<Combustible> findByQuincenaIdAndRutaContexto(Long quincenaId, String rutaContexto);
}
