package com.smartlech.adminlecheria.repository;

import com.smartlech.adminlecheria.entity.DescuentoCuenta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DescuentoCuentaRepository extends JpaRepository<DescuentoCuenta, Long> {
    List<DescuentoCuenta> findByQuincenaId(Long quincenaId);
    List<DescuentoCuenta> findByQuincenaIdAndTipo(Long quincenaId, String tipo);
    boolean existsByQuincenaIdAndTipoAndNombre(Long quincenaId, String tipo, String nombre);
}
