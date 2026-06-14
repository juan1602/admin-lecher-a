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

    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<ReciboEmpresa> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(reciboEmpresaService.buscarPorId(id));
    }

    @GetMapping("/empresas")
    public List<String> empresasDistintas() {
        return reciboEmpresaService.listarEmpresasDistintas();
    }

    @GetMapping("/transporte/{quincenaId}")
    public ResponseEntity<TransporteResumenDTO> resumenTransporte(@PathVariable Long quincenaId) {
        return ResponseEntity.ok(reciboEmpresaService.resumenTransporte(quincenaId));
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody ReciboEmpresa recibo) {
        try {
            return ResponseEntity.ok(reciboEmpresaService.guardar(recibo));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReciboEmpresa> actualizar(@PathVariable Long id, @RequestBody ReciboEmpresa recibo) {
        ReciboEmpresa existente = reciboEmpresaService.buscarPorId(id);
        existente.setNombreRecibo(recibo.getNombreRecibo());
        existente.setLitrosRecibidos(recibo.getLitrosRecibidos());
        existente.setPrecioLitro(recibo.getPrecioLitro());
        existente.setPrecioTransporte(recibo.getPrecioTransporte());
        existente.setSoloTransporte(recibo.getSoloTransporte());
        existente.setFecha(recibo.getFecha());
        existente.setRuta(recibo.getRuta());
        ReciboEmpresa guardado = reciboEmpresaService.guardar(existente);
        Long quincenaId = existente.getQuincena().getId();
        String nombre = existente.getNombreRecibo();
        // Propagar precio a todos los días del mismo recibo en la quincena
        reciboEmpresaService.propagarPrecio(
            quincenaId, nombre,
            recibo.getPrecioLitro(),
            recibo.getPrecioTransporte(),
            recibo.getSoloTransporte()
        );
        if (recibo.getRuta() != null) {
            reciboEmpresaService.propagarRuta(quincenaId, nombre, recibo.getRuta());
        }
        return ResponseEntity.ok(guardado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        reciboEmpresaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
