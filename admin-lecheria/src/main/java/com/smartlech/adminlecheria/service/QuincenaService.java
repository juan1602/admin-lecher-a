package com.smartlech.adminlecheria.service;

import com.smartlech.adminlecheria.entity.Quincena;
import com.smartlech.adminlecheria.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QuincenaService {

    private final QuincenaRepository quincenaRepository;
    private final RecoleccionRepository recoleccionRepository;
    private final ReciboEmpresaRepository reciboEmpresaRepository;
    private final DescuentoRepository descuentoRepository;
    private final ExcedenteProveedorRepository excedenteRepository;
    private final DescuentoCuentaRepository descuentoCuentaRepository;
    private final CombustibleRepository combustibleRepository;
    private final IngresoCuentaRepository ingresoCuentaRepository;
    private final IngresoManualCuentaRepository ingresoManualCuentaRepository;
    private final DescuentoCuentaPersonalRepository descuentoCuentaPersonalRepository;

    public List<Quincena> listarTodas() {
        return quincenaRepository.findAll();
    }

    public Quincena guardar(Quincena quincena) {
        if (quincena.getFechaInicio() == null || quincena.getFechaFin() == null) {
            throw new RuntimeException("La fecha de inicio y la fecha fin son obligatorias.");
        }
        if (quincena.getFechaFin().isBefore(quincena.getFechaInicio())) {
            throw new RuntimeException("La fecha fin no puede ser anterior a la fecha de inicio.");
        }
        // Evitar quincenas repetidas (ej. doble clic en Guardar): no se permiten fechas que se crucen
        quincenaRepository.findAll().stream()
            .filter(q -> !q.getId().equals(quincena.getId()))
            .filter(q -> !q.getFechaInicio().isAfter(quincena.getFechaFin())
                      && !q.getFechaFin().isBefore(quincena.getFechaInicio()))
            .findFirst()
            .ifPresent(q -> {
                throw new RuntimeException("Ya existe una quincena en esas fechas: "
                    + (q.getTextoQuincena() != null && !q.getTextoQuincena().isBlank()
                        ? q.getTextoQuincena()
                        : q.getFechaInicio() + " a " + q.getFechaFin()));
            });
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

    // Solo se elimina si la quincena no tiene datos registrados por el usuario, para no perder información por error.
    // Excedentes e ingresos vinculados de cuentas personalizadas se copian solos al abrir Resumen / Cuentas
    // personalizadas (heredar), así que se borran junto con la quincena.
    @Transactional
    public void eliminar(Long id) {
        buscarPorId(id);
        List<String> registros = new ArrayList<>();
        agregarSiHay(registros, recoleccionRepository.countByQuincenaId(id), "recolecciones");
        agregarSiHay(registros, reciboEmpresaRepository.countByQuincenaId(id), "recibos de empresa");
        agregarSiHay(registros, descuentoRepository.countByQuincenaId(id), "descuentos de proveedores");
        agregarSiHay(registros, descuentoCuentaRepository.countByQuincenaId(id), "descuentos de cuentas generales");
        agregarSiHay(registros, combustibleRepository.countByQuincenaId(id), "combustibles");
        agregarSiHay(registros, ingresoManualCuentaRepository.countByQuincenaId(id), "ingresos manuales de cuentas personalizadas");
        agregarSiHay(registros, descuentoCuentaPersonalRepository.countByQuincenaId(id), "descuentos de cuentas personalizadas");

        if (!registros.isEmpty()) {
            throw new RuntimeException("No se puede eliminar: la quincena tiene "
                + String.join(", ", registros) + ". Elimina esos registros primero.");
        }
        excedenteRepository.deleteByQuincenaId(id);
        ingresoCuentaRepository.deleteByQuincenaId(id);
        quincenaRepository.deleteById(id);
    }

    private void agregarSiHay(List<String> registros, long cantidad, String nombre) {
        if (cantidad > 0) registros.add(cantidad + " " + nombre);
    }
}
