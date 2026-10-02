package com.smartlech.adminlecheria.controller;

import com.smartlech.adminlecheria.entity.Descuento;
import com.smartlech.adminlecheria.service.DescuentoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/descuentos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DescuentoController {

    private final DescuentoService descuentoService;

    @GetMapping("/quincena/{quincenaId}")
    public List<Descuento> listarPorQuincena(@PathVariable Long quincenaId) {
        return descuentoService.listarPorQuincena(quincenaId);
    }

    @PostMapping
    public ResponseEntity<Descuento> crear(@RequestBody Descuento descuento) {
        return ResponseEntity.ok(descuentoService.guardar(descuento));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Descuento> actualizar(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String concepto = (String) body.get("concepto");
        Double valor = ((Number) body.get("valor")).doubleValue();
        String fecha = (String) body.get("fecha");
        LocalDate fechaParsed = fecha != null && !fecha.isBlank() ? LocalDate.parse(fecha) : null;
        return ResponseEntity.ok(descuentoService.actualizar(id, concepto, valor, fechaParsed));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        descuentoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
