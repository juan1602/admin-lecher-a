package com.smartlech.adminlecheria.controller;

import com.smartlech.adminlecheria.entity.Ruta;
import com.smartlech.adminlecheria.service.RutaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/rutas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RutaController {

    private final RutaService rutaService;

    @GetMapping
    public List<Ruta> listarTodas() {
        return rutaService.listarTodas();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ruta> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(rutaService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Ruta> crear(@RequestBody Ruta ruta) {
        return ResponseEntity.ok(rutaService.guardar(ruta));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        rutaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
