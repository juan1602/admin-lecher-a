package com.smartlech.adminlecheria.service;

import com.smartlech.adminlecheria.entity.Descuento;
import com.smartlech.adminlecheria.repository.DescuentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DescuentoService {

    private final DescuentoRepository descuentoRepository;

    public List<Descuento> listarPorQuincena(Long quincenaId) {
        return descuentoRepository.findByQuincenaId(quincenaId);
    }

    public List<Descuento> listarPorProveedorYQuincena(Long proveedorId, Long quincenaId) {
        return descuentoRepository.findByProveedorIdAndQuincenaId(proveedorId, quincenaId);
    }

    public Descuento guardar(Descuento descuento) {
        return descuentoRepository.save(descuento);
    }

    public void eliminar(Long id) {
        descuentoRepository.deleteById(id);
    }
}
