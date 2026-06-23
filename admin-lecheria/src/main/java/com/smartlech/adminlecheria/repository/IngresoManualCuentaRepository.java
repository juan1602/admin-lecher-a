package com.smartlech.adminlecheria.repository;

import com.smartlech.adminlecheria.entity.IngresoManualCuenta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IngresoManualCuentaRepository extends JpaRepository<IngresoManualCuenta, Long> {
    List<IngresoManualCuenta> findByCuentaIdAndQuincenaId(Long cuentaId, Long quincenaId);
    void deleteByCuentaId(Long cuentaId);
}
