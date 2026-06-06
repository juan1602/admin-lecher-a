package com.smartlech.adminlecheria.repository;

import com.smartlech.adminlecheria.entity.GrupoRinde;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GrupoRindeRepository extends JpaRepository<GrupoRinde, Long> {
}
