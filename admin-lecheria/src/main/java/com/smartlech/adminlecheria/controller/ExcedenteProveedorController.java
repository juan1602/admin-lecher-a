package com.smartlech.adminlecheria.controller;

import com.smartlech.adminlecheria.entity.ExcedenteProveedor;
import com.smartlech.adminlecheria.service.ExcedenteProveedorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/excedentes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ExcedenteProveedorController {

    private final ExcedenteProveedorService excedenteService;

    @GetMapping("/quincena/{quincenaId}")
    public List<ExcedenteProveedor> listarPorQuincena(@PathVariable Long quincenaId) {
        return excedenteService.listarPorQuincena(quincenaId);
    }

    @PostMapping("/quincena/{quincenaId}/heredar")
    public ResponseEntity<Void> heredar(@PathVariable Long quincenaId) {
        excedenteService.heredarDeQuincenaAnterior(quincenaId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/quincena/{quincenaId}/proveedor/{proveedorId}")
    public ResponseEntity<ExcedenteProveedor> guardar(
            @PathVariable Long quincenaId,
            @PathVariable Long proveedorId,
            @RequestBody Map<String, Double> body) {
        return ResponseEntity.ok(excedenteService.guardarOActualizar(quincenaId, proveedorId, body.get("valorPorLitro")));
    }

    @DeleteMapping("/quincena/{quincenaId}/proveedor/{proveedorId}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long quincenaId,
            @PathVariable Long proveedorId) {
        excedenteService.eliminarPorQuincenaYProveedor(quincenaId, proveedorId);
        return ResponseEntity.noContent().build();
    }
}
