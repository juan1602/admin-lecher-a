package com.smartlech.adminlecheria.repository;

import com.smartlech.adminlecheria.entity.DescuentoCuentaPersonal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DescuentoCuentaPersonalRepository extends JpaRepository<DescuentoCuentaPersonal, Long> {
    List<DescuentoCuentaPersonal> findByCuentaIdAndQuincenaId(Long cuentaId, Long quincenaId);
    void deleteByCuentaId(Long cuentaId);
}
