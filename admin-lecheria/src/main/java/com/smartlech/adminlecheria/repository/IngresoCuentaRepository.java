package com.smartlech.adminlecheria.repository;

import com.smartlech.adminlecheria.entity.IngresoCuenta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IngresoCuentaRepository extends JpaRepository<IngresoCuenta, Long> {
    List<IngresoCuenta> findByCuentaIdAndReciboQuincenaId(Long cuentaId, Long quincenaId);
    boolean existsByCuentaIdAndReciboId(Long cuentaId, Long reciboId);
    void deleteByCuentaIdAndReciboId(Long cuentaId, Long reciboId);
    void deleteByCuentaId(Long cuentaId);
}
