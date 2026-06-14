package com.smartlech.adminlecheria.controller;

import com.smartlech.adminlecheria.entity.Combustible;
import com.smartlech.adminlecheria.service.CombustibleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/combustibles")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CombustibleController {

    private final CombustibleService combustibleService;

    @GetMapping("/quincena/{quincenaId}")
    public List<Combustible> listarPorQuincena(
            @PathVariable Long quincenaId,
            @RequestParam String rutaContexto) {
        return combustibleService.listarPorQuincenaYContexto(quincenaId, rutaContexto);
    }

    @PostMapping
    public ResponseEntity<Combustible> crear(@RequestBody Combustible combustible) {
        return ResponseEntity.ok(combustibleService.guardar(combustible));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        combustibleService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
