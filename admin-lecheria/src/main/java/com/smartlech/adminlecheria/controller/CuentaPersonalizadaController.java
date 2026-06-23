package com.smartlech.adminlecheria.controller;

import com.smartlech.adminlecheria.entity.*;
import com.smartlech.adminlecheria.service.CuentaPersonalizadaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cuentas-personalizadas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CuentaPersonalizadaController {

    private final CuentaPersonalizadaService service;

    // ── Cuentas ────────────────────────────────────────────────────────────

    @GetMapping
    public List<CuentaPersonalizada> listar() {
        return service.listarTodas();
    }

    @PostMapping
    public ResponseEntity<CuentaPersonalizada> crear(@RequestBody CuentaPersonalizada cuenta) {
        return ResponseEntity.ok(service.guardar(cuenta));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    // ── Ingresos ──────────────────────────────────────────────────────────

    @GetMapping("/{id}/ingresos")
    public List<IngresoCuenta> listarIngresos(
            @PathVariable Long id,
            @RequestParam Long quincenaId) {
        return service.listarIngresos(id, quincenaId);
    }

    @PostMapping("/{id}/ingresos")
    public ResponseEntity<Void> agregarIngreso(
            @PathVariable Long id,
            @RequestParam Long quincenaId,
            @RequestBody Map<String, String> body) {
        service.agregarIngreso(id, quincenaId, body.get("nombreRecibo"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/ingresos/heredar")
    public ResponseEntity<List<IngresoCuenta>> heredarIngresos(
            @PathVariable Long id,
            @RequestParam Long quincenaId) {
        return ResponseEntity.ok(service.heredarIngresos(id, quincenaId));
    }

    @DeleteMapping("/{id}/ingresos")
    public ResponseEntity<Void> quitarIngreso(
            @PathVariable Long id,
            @RequestParam Long quincenaId,
            @RequestParam String nombreRecibo) {
        service.quitarIngreso(id, quincenaId, nombreRecibo);
        return ResponseEntity.noContent().build();
    }

    // ── Ingresos manuales ─────────────────────────────────────────────────

    @GetMapping("/{id}/ingresos-manual")
    public List<IngresoManualCuenta> listarIngresosManual(
            @PathVariable Long id,
            @RequestParam Long quincenaId) {
        return service.listarIngresosManual(id, quincenaId);
    }

    @PostMapping("/{id}/ingresos-manual")
    public ResponseEntity<IngresoManualCuenta> agregarIngresoManual(
            @PathVariable Long id,
            @RequestParam Long quincenaId,
            @RequestBody Map<String, Object> body) {
        String descripcion = (String) body.get("descripcion");
        Double valor = ((Number) body.get("valor")).doubleValue();
        return ResponseEntity.ok(service.agregarIngresoManual(id, quincenaId, descripcion, valor));
    }

    @PutMapping("/ingresos-manual/{id}")
    public ResponseEntity<IngresoManualCuenta> actualizarIngresoManual(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String descripcion = (String) body.get("descripcion");
        Double valor = ((Number) body.get("valor")).doubleValue();
        return ResponseEntity.ok(service.actualizarIngresoManual(id, descripcion, valor));
    }

    @DeleteMapping("/ingresos-manual/{id}")
    public ResponseEntity<Void> eliminarIngresoManual(@PathVariable Long id) {
        service.eliminarIngresoManual(id);
        return ResponseEntity.noContent().build();
    }

    // ── Descuentos ────────────────────────────────────────────────────────

    @GetMapping("/{id}/descuentos")
    public List<DescuentoCuentaPersonal> listarDescuentos(
            @PathVariable Long id,
            @RequestParam Long quincenaId) {
        return service.listarDescuentos(id, quincenaId);
    }

    @PostMapping("/{id}/descuentos")
    public ResponseEntity<DescuentoCuentaPersonal> agregarDescuento(
            @PathVariable Long id,
            @RequestParam Long quincenaId,
            @RequestBody Map<String, Object> body) {
        DescuentoCuentaPersonal d = new DescuentoCuentaPersonal();
        d.setDescripcion((String) body.get("descripcion"));
        d.setValor(((Number) body.get("valor")).doubleValue());
        return ResponseEntity.ok(service.agregarDescuento(id, quincenaId, d));
    }

    @DeleteMapping("/descuentos/{id}")
    public ResponseEntity<Void> eliminarDescuento(@PathVariable Long id) {
        service.eliminarDescuento(id);
        return ResponseEntity.noContent().build();
    }
}
