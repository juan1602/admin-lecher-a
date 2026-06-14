package com.smartlech.adminlecheria.repository;

import com.smartlech.adminlecheria.entity.ExcedenteProveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ExcedenteProveedorRepository extends JpaRepository<ExcedenteProveedor, Long> {
    List<ExcedenteProveedor> findByQuincenaId(Long quincenaId);
    Optional<ExcedenteProveedor> findByQuincenaIdAndProveedorId(Long quincenaId, Long proveedorId);
}
