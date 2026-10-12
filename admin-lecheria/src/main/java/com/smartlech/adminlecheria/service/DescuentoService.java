package com.smartlech.adminlecheria.service;

import com.smartlech.adminlecheria.entity.Descuento;
import com.smartlech.adminlecheria.repository.DescuentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DescuentoService {

    private final DescuentoRepository descuentoRepository;
    private final QuincenaGuard quincenaGuard;

    public List<Descuento> listarPorQuincena(Long quincenaId) {
        return descuentoRepository.findByQuincenaId(quincenaId);
    }

    public List<Descuento> listarPorProveedorYQuincena(Long proveedorId, Long quincenaId) {
        return descuentoRepository.findByProveedorIdAndQuincenaId(proveedorId, quincenaId);
    }

    public Descuento guardar(Descuento descuento) {
        quincenaGuard.validarAbierta(descuento.getQuincena());
        return descuentoRepository.save(descuento);
    }

    public Descuento actualizar(Long id, String concepto, Double valor, LocalDate fecha) {
        Descuento d = descuentoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Descuento no encontrado: " + id));
        quincenaGuard.validarAbierta(d.getQuincena());
        d.setConcepto(concepto);
        d.setValor(valor);
        d.setFecha(fecha);
        return descuentoRepository.save(d);
    }

    public void eliminar(Long id) {
        descuentoRepository.findById(id).ifPresent(d -> quincenaGuard.validarAbierta(d.getQuincena()));
        descuentoRepository.deleteById(id);
    }
}
