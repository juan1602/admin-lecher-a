package com.smartlech.adminlecheria.repository;

import com.smartlech.adminlecheria.entity.MovimientoCuenta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MovimientoCuentaRepository extends JpaRepository<MovimientoCuenta, Long> {
    List<MovimientoCuenta> findByCuentaId(Long cuentaId);
    void deleteByCuentaId(Long cuentaId);
}
