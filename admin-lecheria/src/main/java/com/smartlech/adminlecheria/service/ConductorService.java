package com.smartlech.adminlecheria.service;

import com.smartlech.adminlecheria.entity.Conductor;
import com.smartlech.adminlecheria.repository.ConductorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ConductorService {

    private final ConductorRepository conductorRepository;

    public List<Conductor> listarActivos() {
        return conductorRepository.findByActivoTrue();
    }

    public List<Conductor> listarTodos() {
        return conductorRepository.findAll();
    }

    public Conductor guardar(Conductor conductor) {
        return conductorRepository.save(conductor);
    }

    public Conductor buscarPorId(Long id) {
        return conductorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conductor no encontrado: " + id));
    }

    public void desactivar(Long id) {
        Conductor conductor = buscarPorId(id);
        conductor.setActivo(false);
        conductorRepository.save(conductor);
    }
}
