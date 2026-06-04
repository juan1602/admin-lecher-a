package com.smartlech.adminlecheria.repository;

import com.smartlech.adminlecheria.entity.Descuento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DescuentoRepository extends JpaRepository<Descuento, Long> {
    List<Descuento> findByQuincenaId(Long quincenaId);
    List<Descuento> findByProveedorIdAndQuincenaId(Long proveedorId, Long quincenaId);
}
