package com.smartlech.adminlecheria.repository;

import com.smartlech.adminlecheria.entity.ReciboEmpresa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReciboEmpresaRepository extends JpaRepository<ReciboEmpresa, Long> {
    List<ReciboEmpresa> findByQuincenaId(Long quincenaId);
}
