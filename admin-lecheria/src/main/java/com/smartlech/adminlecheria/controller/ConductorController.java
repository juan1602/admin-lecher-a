package com.smartlech.adminlecheria.controller;

import com.smartlech.adminlecheria.entity.Conductor;
import com.smartlech.adminlecheria.service.ConductorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/conductores")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ConductorController {

    private final ConductorService conductorService;

    @GetMapping
    public List<Conductor> listarActivos() {
        return conductorService.listarActivos();
    }

    @GetMapping("/todos")
    public List<Conductor> listarTodos() {
        return conductorService.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Conductor> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(conductorService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Conductor> crear(@RequestBody Conductor conductor) {
        return ResponseEntity.ok(conductorService.guardar(conductor));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Conductor> actualizar(@PathVariable Long id, @RequestBody Conductor conductor) {
        Conductor existente = conductorService.buscarPorId(id);
        existente.setNombre(conductor.getNombre());
        existente.setTelefono(conductor.getTelefono());
        existente.setRutaIds(conductor.getRutaIds() != null ? conductor.getRutaIds() : new java.util.HashSet<>());
        return ResponseEntity.ok(conductorService.guardar(existente));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        conductorService.desactivar(id);
        return ResponseEntity.noContent().build();
    }
}
