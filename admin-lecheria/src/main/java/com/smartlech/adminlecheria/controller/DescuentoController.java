package com.smartlech.adminlecheria.controller;

import com.smartlech.adminlecheria.entity.Descuento;
import com.smartlech.adminlecheria.service.DescuentoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        descuentoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
