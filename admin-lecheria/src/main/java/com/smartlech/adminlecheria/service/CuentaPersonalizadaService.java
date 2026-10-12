package com.smartlech.adminlecheria.service;

import com.smartlech.adminlecheria.entity.*;
import com.smartlech.adminlecheria.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CuentaPersonalizadaService {

    private final CuentaPersonalizadaRepository cuentaRepository;
    private final IngresoCuentaRepository ingresoRepository;
    private final IngresoManualCuentaRepository ingresoManualRepository;
    private final DescuentoCuentaPersonalRepository descuentoRepository;
    private final QuincenaRepository quincenaRepository;
    private final QuincenaGuard quincenaGuard;

    public List<CuentaPersonalizada> listarTodas() {
        return cuentaRepository.findAll();
    }

    public CuentaPersonalizada guardar(CuentaPersonalizada cuenta) {
        return cuentaRepository.save(cuenta);
    }

    @Transactional
    public void eliminar(Long id) {
        ingresoRepository.deleteByCuentaId(id);
        ingresoManualRepository.deleteByCuentaId(id);
        descuentoRepository.deleteByCuentaId(id);
        cuentaRepository.deleteById(id);
    }

    // ── Ingresos (por nombre de empresa, agrupa todos los días) ───────────

    public List<IngresoCuenta> listarIngresos(Long cuentaId, Long quincenaId) {
        return ingresoRepository.findByCuentaIdAndQuincenaId(cuentaId, quincenaId);
    }

    @Transactional
    public void agregarIngreso(Long cuentaId, Long quincenaId, String nombreRecibo) {
        quincenaGuard.validarAbierta(quincenaId);
        if (ingresoRepository.existsByCuentaIdAndQuincenaIdAndNombreRecibo(cuentaId, quincenaId, nombreRecibo)) return;
        CuentaPersonalizada cuenta = cuentaRepository.findById(cuentaId)
            .orElseThrow(() -> new RuntimeException("Cuenta no encontrada: " + cuentaId));
        Quincena quincena = quincenaRepository.findById(quincenaId)
            .orElseThrow(() -> new RuntimeException("Quincena no encontrada: " + quincenaId));
        IngresoCuenta ingreso = new IngresoCuenta();
        ingreso.setCuenta(cuenta);
        ingreso.setQuincena(quincena);
        ingreso.setNombreRecibo(nombreRecibo);
        ingresoRepository.save(ingreso);
    }

    @Transactional
    public void quitarIngreso(Long cuentaId, Long quincenaId, String nombreRecibo) {
        quincenaGuard.validarAbierta(quincenaId);
        ingresoRepository.deleteByCuentaIdAndQuincenaIdAndNombreRecibo(cuentaId, quincenaId, nombreRecibo);
    }

    // ── Descuentos ─────────────────────────────────────────────────────────

    public List<DescuentoCuentaPersonal> listarDescuentos(Long cuentaId, Long quincenaId) {
        return descuentoRepository.findByCuentaIdAndQuincenaId(cuentaId, quincenaId);
    }

    public DescuentoCuentaPersonal agregarDescuento(Long cuentaId, Long quincenaId, DescuentoCuentaPersonal d) {
        quincenaGuard.validarAbierta(quincenaId);
        CuentaPersonalizada cuenta = cuentaRepository.findById(cuentaId)
            .orElseThrow(() -> new RuntimeException("Cuenta no encontrada: " + cuentaId));
        Quincena quincena = quincenaRepository.findById(quincenaId)
            .orElseThrow(() -> new RuntimeException("Quincena no encontrada: " + quincenaId));
        d.setCuenta(cuenta);
        d.setQuincena(quincena);
        return descuentoRepository.save(d);
    }

    public void eliminarDescuento(Long id) {
        descuentoRepository.findById(id).ifPresent(d -> quincenaGuard.validarAbierta(d.getQuincena()));
        descuentoRepository.deleteById(id);
    }

    // ── Ingresos manuales ──────────────────────────────────────────────────

    public List<IngresoManualCuenta> listarIngresosManual(Long cuentaId, Long quincenaId) {
        return ingresoManualRepository.findByCuentaIdAndQuincenaId(cuentaId, quincenaId);
    }

    public IngresoManualCuenta agregarIngresoManual(Long cuentaId, Long quincenaId, String descripcion, Double valor) {
        quincenaGuard.validarAbierta(quincenaId);
        CuentaPersonalizada cuenta = cuentaRepository.findById(cuentaId)
            .orElseThrow(() -> new RuntimeException("Cuenta no encontrada: " + cuentaId));
        Quincena quincena = quincenaRepository.findById(quincenaId)
            .orElseThrow(() -> new RuntimeException("Quincena no encontrada: " + quincenaId));
        IngresoManualCuenta ingreso = new IngresoManualCuenta();
        ingreso.setCuenta(cuenta);
        ingreso.setQuincena(quincena);
        ingreso.setDescripcion(descripcion);
        ingreso.setValor(valor);
        return ingresoManualRepository.save(ingreso);
    }

    public IngresoManualCuenta actualizarIngresoManual(Long id, String descripcion, Double valor) {
        IngresoManualCuenta m = ingresoManualRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Ingreso manual no encontrado: " + id));
        quincenaGuard.validarAbierta(m.getQuincena());
        m.setDescripcion(descripcion);
        m.setValor(valor);
        return ingresoManualRepository.save(m);
    }

    public void eliminarIngresoManual(Long id) {
        ingresoManualRepository.findById(id).ifPresent(m -> quincenaGuard.validarAbierta(m.getQuincena()));
        ingresoManualRepository.deleteById(id);
    }

    @Transactional
    public List<IngresoCuenta> heredarIngresos(Long cuentaId, Long quincenaId) {
        // Si ya hay ingresos en esta quincena, no hacer nada
        List<IngresoCuenta> existentes = ingresoRepository.findByCuentaIdAndQuincenaId(cuentaId, quincenaId);
        if (!existentes.isEmpty()) return existentes;
        if (quincenaGuard.estaCerrada(quincenaId)) return new ArrayList<>();

        Quincena quincena = quincenaRepository.findById(quincenaId)
                .orElseThrow(() -> new RuntimeException("Quincena no encontrada: " + quincenaId));

        // Quincena anterior más reciente
        Quincena anterior = quincenaRepository.findAll().stream()
                .filter(q -> !q.getId().equals(quincenaId) && q.getFechaFin().isBefore(quincena.getFechaInicio()))
                .max(Comparator.comparing(Quincena::getFechaFin))
                .orElse(null);

        if (anterior == null) return new ArrayList<>();

        List<IngresoCuenta> ingresosAnteriores = ingresoRepository.findByCuentaIdAndQuincenaId(cuentaId, anterior.getId());
        if (ingresosAnteriores.isEmpty()) return new ArrayList<>();

        CuentaPersonalizada cuenta = cuentaRepository.findById(cuentaId)
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada: " + cuentaId));

        List<IngresoCuenta> creados = new ArrayList<>();
        for (IngresoCuenta ref : ingresosAnteriores) {
            IngresoCuenta nuevo = new IngresoCuenta();
            nuevo.setCuenta(cuenta);
            nuevo.setQuincena(quincena);
            nuevo.setNombreRecibo(ref.getNombreRecibo());
            creados.add(ingresoRepository.save(nuevo));
        }
        return creados;
    }
}
