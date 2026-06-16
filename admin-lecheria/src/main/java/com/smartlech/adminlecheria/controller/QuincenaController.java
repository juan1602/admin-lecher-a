package com.smartlech.adminlecheria.controller;

import com.smartlech.adminlecheria.entity.Quincena;
import com.smartlech.adminlecheria.service.QuincenaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/quincenas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class QuincenaController {

    private final QuincenaService quincenaService;

    @GetMapping
    public List<Quincena> listarTodas() {
        return quincenaService.listarTodas();
    }

    @GetMapping("/abierta")
    public ResponseEntity<Quincena> buscarAbierta() {
        return ResponseEntity.ok(quincenaService.buscarAbierta());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Quincena> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(quincenaService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Quincena> crear(@RequestBody Quincena quincena) {
        return ResponseEntity.ok(quincenaService.guardar(quincena));
    }

    @PutMapping("/{id}/cerrar")
    public ResponseEntity<Quincena> cerrar(@PathVariable Long id) {
        return ResponseEntity.ok(quincenaService.cerrar(id));
    }

    @PutMapping("/{id}/reabrir")
    public ResponseEntity<?> reabrir(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(quincenaService.reabrir(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
