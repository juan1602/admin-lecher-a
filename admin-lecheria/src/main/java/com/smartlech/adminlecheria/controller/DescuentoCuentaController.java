package com.smartlech.adminlecheria.controller;

import com.smartlech.adminlecheria.entity.DescuentoCuenta;
import com.smartlech.adminlecheria.service.DescuentoCuentaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/descuentos-cuenta")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DescuentoCuentaController {

    private final DescuentoCuentaService descuentoService;

    @GetMapping("/quincena/{quincenaId}")
    public List<DescuentoCuenta> listarPorQuincena(
            @PathVariable Long quincenaId,
            @RequestParam String rutaContexto) {
        return descuentoService.listarPorQuincenaYContexto(quincenaId, rutaContexto);
    }

    @PostMapping("/quincena/{quincenaId}/heredar")
    public ResponseEntity<Void> heredar(
            @PathVariable Long quincenaId,
            @RequestParam String rutaContexto) {
        descuentoService.heredarDeQuincenaAnterior(quincenaId, rutaContexto);
        return ResponseEntity.ok().build();
    }

    @PostMapping
    public ResponseEntity<DescuentoCuenta> crear(@RequestBody DescuentoCuenta descuento) {
        return ResponseEntity.ok(descuentoService.guardar(descuento));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DescuentoCuenta> actualizar(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String nombre = (String) body.get("nombre");
        Double valor = ((Number) body.get("valor")).doubleValue();
        return ResponseEntity.ok(descuentoService.actualizar(id, nombre, valor));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        descuentoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
