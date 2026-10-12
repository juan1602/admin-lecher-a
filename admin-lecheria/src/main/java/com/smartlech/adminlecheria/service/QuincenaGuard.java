package com.smartlech.adminlecheria.service;

import com.smartlech.adminlecheria.entity.Quincena;
import com.smartlech.adminlecheria.exception.QuincenaCerradaException;
import com.smartlech.adminlecheria.repository.QuincenaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

// Impide modificar datos de quincenas cerradas (para corregir algo: Reabrir → corregir → Cerrar)
@Component
@RequiredArgsConstructor
public class QuincenaGuard {

    private final QuincenaRepository quincenaRepository;

    public boolean estaCerrada(Long quincenaId) {
        if (quincenaId == null) return false;
        return quincenaRepository.findById(quincenaId)
            .map(q -> Boolean.TRUE.equals(q.getCerrada()))
            .orElse(false);
    }

    public void validarAbierta(Long quincenaId) {
        if (quincenaId == null) return;
        quincenaRepository.findById(quincenaId)
            .filter(q -> Boolean.TRUE.equals(q.getCerrada()))
            .ifPresent(q -> {
                throw new QuincenaCerradaException("La quincena "
                    + (q.getTextoQuincena() != null && !q.getTextoQuincena().isBlank()
                        ? "'" + q.getTextoQuincena() + "'"
                        : q.getFechaInicio() + " a " + q.getFechaFin())
                    + " está cerrada. Reábrela en Quincenas para hacer cambios.");
            });
    }

    public void validarAbierta(Quincena quincena) {
        if (quincena != null) validarAbierta(quincena.getId());
    }
}
