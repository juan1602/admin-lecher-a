package com.smartlech.adminlecheria.service;

import com.smartlech.adminlecheria.entity.DescuentoCuenta;
import com.smartlech.adminlecheria.entity.Quincena;
import com.smartlech.adminlecheria.repository.DescuentoCuentaRepository;
import com.smartlech.adminlecheria.repository.QuincenaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DescuentoCuentaService {

    private final DescuentoCuentaRepository descuentoRepository;
    private final QuincenaRepository quincenaRepository;

    public List<DescuentoCuenta> listarPorQuincenaYContexto(Long quincenaId, String rutaContexto) {
        return descuentoRepository.findByQuincenaIdAndRutaContexto(quincenaId, rutaContexto);
    }

    public DescuentoCuenta guardar(DescuentoCuenta descuento) {
        return descuentoRepository.save(descuento);
    }

    public DescuentoCuenta actualizar(Long id, String nombre, Double valor) {
        DescuentoCuenta d = descuentoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Descuento no encontrado: " + id));
        d.setNombre(nombre);
        d.setValor(valor);
        return descuentoRepository.save(d);
    }

    public void eliminar(Long id) {
        descuentoRepository.deleteById(id);
    }

    // Copia descuentos del mismo rutaContexto desde la quincena anterior
    public void heredarDeQuincenaAnterior(Long quincenaId, String rutaContexto) {
        Quincena actual = quincenaRepository.findById(quincenaId)
            .orElseThrow(() -> new RuntimeException("Quincena no encontrada: " + quincenaId));

        Quincena anterior = quincenaRepository.findAll().stream()
            .filter(q -> !q.getId().equals(quincenaId) && q.getFechaFin().isBefore(actual.getFechaInicio()))
            .max(Comparator.comparing(Quincena::getFechaFin))
            .orElse(null);

        if (anterior == null) return;

        List<DescuentoCuenta> anteriores = descuentoRepository
            .findByQuincenaIdAndRutaContexto(anterior.getId(), rutaContexto);

        for (DescuentoCuenta d : anteriores) {
            if (!descuentoRepository.existsByQuincenaIdAndTipoAndNombreAndRutaContexto(
                    quincenaId, d.getTipo(), d.getNombre(), rutaContexto)) {
                DescuentoCuenta nuevo = new DescuentoCuenta();
                nuevo.setQuincena(actual);
                nuevo.setTipo(d.getTipo());
                nuevo.setNombre(d.getNombre());
                nuevo.setValor(d.getValor());
                nuevo.setRutaContexto(rutaContexto);
                descuentoRepository.save(nuevo);
            }
        }
    }
}
