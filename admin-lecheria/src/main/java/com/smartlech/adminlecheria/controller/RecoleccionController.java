package com.smartlech.adminlecheria.controller;

import com.smartlech.adminlecheria.dto.ResumenQuincenaDTO;
import com.smartlech.adminlecheria.entity.Recoleccion;
import com.smartlech.adminlecheria.service.RecoleccionService;
import com.smartlech.adminlecheria.repository.RecoleccionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/recolecciones")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RecoleccionController {

    private final RecoleccionService recoleccionService;
    private final RecoleccionRepository recoleccionRepository;

    @GetMapping("/quincena/{quincenaId}")
    public List<Recoleccion> listarPorQuincena(@PathVariable Long quincenaId) {
        return recoleccionService.listarPorQuincena(quincenaId);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Recoleccion> actualizar(@PathVariable Long id, @RequestBody Recoleccion recoleccion) {
        Recoleccion existente = recoleccionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Recolección no encontrada"));
        existente.setLitrosRecolectados(recoleccion.getLitrosRecolectados());
        existente.setVale(recoleccion.getVale());
        existente.setConductor(recoleccion.getConductor());
        return ResponseEntity.ok(recoleccionRepository.save(existente));
    }

    @GetMapping("/pendientes")
    public List<Recoleccion> listarPendientes() {
        return recoleccionService.listarPendientesSincronizacion();
    }

    @PostMapping
    public ResponseEntity<Recoleccion> crear(@RequestBody Recoleccion recoleccion) {
        return ResponseEntity.ok(recoleccionService.guardar(recoleccion));
    }

    @PostMapping("/sincronizar")
    public ResponseEntity<List<Recoleccion>> sincronizar(@RequestBody List<Recoleccion> recolecciones) {
        return ResponseEntity.ok(recoleccionService.sincronizar(recolecciones));
    }

    @GetMapping("/resumen/{quincenaId}")
    public ResponseEntity<ResumenQuincenaDTO> resumen(@PathVariable Long quincenaId) {
        return ResponseEntity.ok(recoleccionService.resumenPorQuincena(quincenaId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        recoleccionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
