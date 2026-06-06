package com.smartlech.adminlecheria.repository;

import com.smartlech.adminlecheria.entity.ReciboEmpresa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReciboEmpresaRepository extends JpaRepository<ReciboEmpresa, Long> {
    List<ReciboEmpresa> findByQuincenaId(Long quincenaId);

    @Query("SELECT DISTINCT r.nombreRecibo FROM ReciboEmpresa r WHERE r.nombreRecibo IS NOT NULL ORDER BY r.nombreRecibo")
    List<String> findNombresDistintos();
}
