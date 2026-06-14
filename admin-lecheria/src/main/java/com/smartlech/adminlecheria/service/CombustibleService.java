package com.smartlech.adminlecheria.service;

import com.smartlech.adminlecheria.entity.Combustible;
import com.smartlech.adminlecheria.repository.CombustibleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CombustibleService {

    private final CombustibleRepository combustibleRepository;

    public List<Combustible> listarPorQuincena(Long quincenaId) {
        return combustibleRepository.findByQuincenaId(quincenaId);
    }

    public Combustible guardar(Combustible combustible) {
        return combustibleRepository.save(combustible);
    }

    public void eliminar(Long id) {
        combustibleRepository.deleteById(id);
    }
}
