package com.smartlech.adminlecheria.repository;

import com.smartlech.adminlecheria.entity.IngresoCuenta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IngresoCuentaRepository extends JpaRepository<IngresoCuenta, Long> {
    List<IngresoCuenta> findByCuentaIdAndQuincenaId(Long cuentaId, Long quincenaId);
    boolean existsByCuentaIdAndQuincenaIdAndNombreRecibo(Long cuentaId, Long quincenaId, String nombreRecibo);
    void deleteByCuentaIdAndQuincenaIdAndNombreRecibo(Long cuentaId, Long quincenaId, String nombreRecibo);
    void deleteByCuentaId(Long cuentaId);
}
