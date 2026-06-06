package com.smartlech.adminlecheria.controller;

import com.smartlech.adminlecheria.dto.RindeGrupoDTO;
import com.smartlech.adminlecheria.dto.TransporteCompletoDTO;
import com.smartlech.adminlecheria.entity.GrupoRinde;
import com.smartlech.adminlecheria.service.GrupoRindeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grupos-rinde")
@RequiredArgsConstructor
public class GrupoRindeController {

    private final GrupoRindeService grupoRindeService;

    @GetMapping
    public List<GrupoRinde> listar() {
        return grupoRindeService.listar();
    }

    @PostMapping
    public GrupoRinde crear(@RequestBody GrupoRinde grupo) {
        return grupoRindeService.guardar(grupo);
    }

    @PutMapping("/{id}")
    public GrupoRinde actualizar(@PathVariable Long id, @RequestBody GrupoRinde grupo) {
        grupo.setId(id);
        return grupoRindeService.guardar(grupo);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        grupoRindeService.eliminar(id);
    }

    @GetMapping("/transporte/{quincenaId}")
    public List<RindeGrupoDTO> transporte(@PathVariable Long quincenaId) {
        return grupoRindeService.calcularRindePorGrupo(quincenaId);
    }

    @GetMapping("/vista-completa/{quincenaId}")
    public TransporteCompletoDTO vistaCompleta(@PathVariable Long quincenaId) {
        return grupoRindeService.calcularVistaCompleta(quincenaId);
    }
}
