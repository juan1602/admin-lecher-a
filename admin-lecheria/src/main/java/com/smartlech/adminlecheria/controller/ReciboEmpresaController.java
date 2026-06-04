package com.smartlech.adminlecheria.controller;

import com.smartlech.adminlecheria.dto.TransporteResumenDTO;
import com.smartlech.adminlecheria.entity.ReciboEmpresa;
import com.smartlech.adminlecheria.service.ReciboEmpresaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/recibos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReciboEmpresaController {

    private final ReciboEmpresaService reciboEmpresaService;

    @GetMapping("/quincena/{quincenaId}")
    public List<ReciboEmpresa> listarPorQuincena(@PathVariable Long quincenaId) {
        return reciboEmpresaService.listarPorQuincena(quincenaId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReciboEmpresa> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(reciboEmpresaService.buscarPorId(id));
    }

    @GetMapping("/transporte/{quincenaId}")
    public ResponseEntity<TransporteResumenDTO> resumenTransporte(@PathVariable Long quincenaId) {
        return ResponseEntity.ok(reciboEmpresaService.resumenTransporte(quincenaId));
    }

    @PostMapping
    public ResponseEntity<ReciboEmpresa> crear(@RequestBody ReciboEmpresa recibo) {
        return ResponseEntity.ok(reciboEmpresaService.guardar(recibo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReciboEmpresa> actualizar(@PathVariable Long id, @RequestBody ReciboEmpresa recibo) {
        ReciboEmpresa existente = reciboEmpresaService.buscarPorId(id);
        existente.setNombreRecibo(recibo.getNombreRecibo());
        existente.setLitrosRecibidos(recibo.getLitrosRecibidos());
        existente.setPrecioLitro(recibo.getPrecioLitro());
        existente.setPrecioTransporte(recibo.getPrecioTransporte());
        existente.setFecha(recibo.getFecha());
        return ResponseEntity.ok(reciboEmpresaService.guardar(existente));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        reciboEmpresaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
