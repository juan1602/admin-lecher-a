package com.smartlech.adminlecheria.repository;

import com.smartlech.adminlecheria.entity.Recoleccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RecoleccionRepository extends JpaRepository<Recoleccion, Long> {
    List<Recoleccion> findByQuincenaId(Long quincenaId);
    List<Recoleccion> findByProveedorIdAndQuincenaId(Long proveedorId, Long quincenaId);
    List<Recoleccion> findBySincronizadoFalse();
}
