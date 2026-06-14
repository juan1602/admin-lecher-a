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
    private final ReciboEmpresaRepository reciboRepository;
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

    // ── Ingresos (recibos vinculados) ──────────────────────────────────────

    public List<IngresoCuenta> listarIngresos(Long cuentaId, Long quincenaId) {
        return ingresoRepository.findByCuentaIdAndReciboQuincenaId(cuentaId, quincenaId);
    }

    @Transactional
    public void agregarIngreso(Long cuentaId, Long reciboId) {
        if (ingresoRepository.existsByCuentaIdAndReciboId(cuentaId, reciboId)) return;
        CuentaPersonalizada cuenta = cuentaRepository.findById(cuentaId)
            .orElseThrow(() -> new RuntimeException("Cuenta no encontrada: " + cuentaId));
        ReciboEmpresa recibo = reciboRepository.findById(reciboId)
            .orElseThrow(() -> new RuntimeException("Recibo no encontrado: " + reciboId));
        IngresoCuenta ingreso = new IngresoCuenta();
        ingreso.setCuenta(cuenta);
        ingreso.setRecibo(recibo);
        ingresoRepository.save(ingreso);
    }

    @Transactional
    public void quitarIngreso(Long cuentaId, Long reciboId) {
        ingresoRepository.deleteByCuentaIdAndReciboId(cuentaId, reciboId);
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
