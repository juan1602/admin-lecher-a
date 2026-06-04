package com.smartlech.adminlecheria.service;

import com.smartlech.adminlecheria.entity.Ruta;
import com.smartlech.adminlecheria.repository.RutaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RutaService {

    private final RutaRepository rutaRepository;

    public List<Ruta> listarTodas() {
        return rutaRepository.findAll();
    }

    public Ruta guardar(Ruta ruta) {
        return rutaRepository.save(ruta);
    }

    public Ruta buscarPorId(Long id) {
        return rutaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ruta no encontrada: " + id));
    }

    public void eliminar(Long id) {
        rutaRepository.deleteById(id);
    }
}
