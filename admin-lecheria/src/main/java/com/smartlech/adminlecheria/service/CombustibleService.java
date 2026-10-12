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
    private final QuincenaGuard quincenaGuard;

    public List<Combustible> listarPorQuincenaYContexto(Long quincenaId, String rutaContexto) {
        return combustibleRepository.findByQuincenaIdAndRutaContexto(quincenaId, rutaContexto);
    }

    public Combustible guardar(Combustible combustible) {
        quincenaGuard.validarAbierta(combustible.getQuincena());
        return combustibleRepository.save(combustible);
    }

    public void eliminar(Long id) {
        combustibleRepository.findById(id).ifPresent(c -> quincenaGuard.validarAbierta(c.getQuincena()));
        combustibleRepository.deleteById(id);
    }
}
