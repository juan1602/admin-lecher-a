package com.smartlech.adminlecheria.service;

import com.smartlech.adminlecheria.entity.*;
import com.smartlech.adminlecheria.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CuentaPersonalizadaService {

    private final CuentaPersonalizadaRepository cuentaRepository;
    private final IngresoCuentaRepository ingresoRepository;
    private final DescuentoCuentaPersonalRepository descuentoRepository;
    private final QuincenaRepository quincenaRepository;

    public List<CuentaPersonalizada> listarTodas() {
        return cuentaRepository.findAll();
    }

    public CuentaPersonalizada guardar(CuentaPersonalizada cuenta) {
        return cuentaRepository.save(cuenta);
    }

    @Transactional
    public void eliminar(Long id) {
        ingresoRepository.deleteByCuentaId(id);
        descuentoRepository.deleteByCuentaId(id);
        cuentaRepository.deleteById(id);
    }

    // ── Ingresos (por nombre de empresa, agrupa todos los días) ───────────

    public List<IngresoCuenta> listarIngresos(Long cuentaId, Long quincenaId) {
        return ingresoRepository.findByCuentaIdAndQuincenaId(cuentaId, quincenaId);
    }

    @Transactional
    public void agregarIngreso(Long cuentaId, Long quincenaId, String nombreRecibo) {
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
        ingresoRepository.deleteByCuentaIdAndQuincenaIdAndNombreRecibo(cuentaId, quincenaId, nombreRecibo);
    }

    // ── Descuentos ─────────────────────────────────────────────────────────

    public List<DescuentoCuentaPersonal> listarDescuentos(Long cuentaId, Long quincenaId) {
        return descuentoRepository.findByCuentaIdAndQuincenaId(cuentaId, quincenaId);
    }

    public DescuentoCuentaPersonal agregarDescuento(Long cuentaId, Long quincenaId, DescuentoCuentaPersonal d) {
        CuentaPersonalizada cuenta = cuentaRepository.findById(cuentaId)
            .orElseThrow(() -> new RuntimeException("Cuenta no encontrada: " + cuentaId));
        Quincena quincena = quincenaRepository.findById(quincenaId)
            .orElseThrow(() -> new RuntimeException("Quincena no encontrada: " + quincenaId));
        d.setCuenta(cuenta);
        d.setQuincena(quincena);
        return descuentoRepository.save(d);
    }

    public void eliminarDescuento(Long id) {
        descuentoRepository.deleteById(id);
    }
}
