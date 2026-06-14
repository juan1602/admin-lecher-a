package com.smartlech.adminlecheria.repository;

import com.smartlech.adminlecheria.entity.DescuentoCuenta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DescuentoCuentaRepository extends JpaRepository<DescuentoCuenta, Long> {
    List<DescuentoCuenta> findByQuincenaIdAndRutaContexto(Long quincenaId, String rutaContexto);
    boolean existsByQuincenaIdAndTipoAndNombreAndRutaContexto(Long quincenaId, String tipo, String nombre, String rutaContexto);
}
