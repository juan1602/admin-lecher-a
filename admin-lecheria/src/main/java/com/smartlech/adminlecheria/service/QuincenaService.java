package com.smartlech.adminlecheria.service;

import com.smartlech.adminlecheria.entity.Quincena;
import com.smartlech.adminlecheria.repository.QuincenaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QuincenaService {

    private final QuincenaRepository quincenaRepository;

    public List<Quincena> listarTodas() {
        return quincenaRepository.findAll();
    }

    public Quincena guardar(Quincena quincena) {
        return quincenaRepository.save(quincena);
    }

    public Quincena buscarPorId(Long id) {
        return quincenaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quincena no encontrada: " + id));
    }

    public Quincena buscarAbierta() {
        return quincenaRepository.findByCerradaFalse()
                .orElseThrow(() -> new RuntimeException("No hay quincena abierta"));
    }

    public Quincena cerrar(Long id) {
        Quincena quincena = buscarPorId(id);
        quincena.setCerrada(true);
        return quincenaRepository.save(quincena);
    }

    public Quincena reabrir(Long id) {
        if (quincenaRepository.findByCerradaFalse().isPresent()) {
            throw new RuntimeException("Ya hay una quincena abierta. Ciérrala antes de reabrir otra.");
        }
        Quincena quincena = buscarPorId(id);
        quincena.setCerrada(false);
        return quincenaRepository.save(quincena);
    }
}
