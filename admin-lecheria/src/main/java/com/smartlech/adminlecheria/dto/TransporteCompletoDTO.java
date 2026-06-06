package com.smartlech.adminlecheria.dto;

import java.util.List;
import java.util.Map;

public class TransporteCompletoDTO {
    private Long quincenaId;
    private String textoQuincena;
    private String fechaInicio;
    private String fechaFin;
    // Todas las empresas en orden: primero las configuradas en grupos, luego las restantes
    private List<String> todasEmpresas;
    // Total de litros por empresa para la fila de totales
    private Map<String, Double> totalLitrosPorEmpresa;
    private List<GrupoCompactoDTO> grupos;
    private List<DiaCompletoDTO> dias;
    private double rindeTotal;

    public Long getQuincenaId() { return quincenaId; }
    public void setQuincenaId(Long quincenaId) { this.quincenaId = quincenaId; }
    public String getTextoQuincena() { return textoQuincena; }
    public void setTextoQuincena(String textoQuincena) { this.textoQuincena = textoQuincena; }
    public String getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(String fechaInicio) { this.fechaInicio = fechaInicio; }
    public String getFechaFin() { return fechaFin; }
    public void setFechaFin(String fechaFin) { this.fechaFin = fechaFin; }
    public List<String> getTodasEmpresas() { return todasEmpresas; }
    public void setTodasEmpresas(List<String> todasEmpresas) { this.todasEmpresas = todasEmpresas; }
    public Map<String, Double> getTotalLitrosPorEmpresa() { return totalLitrosPorEmpresa; }
    public void setTotalLitrosPorEmpresa(Map<String, Double> totalLitrosPorEmpresa) { this.totalLitrosPorEmpresa = totalLitrosPorEmpresa; }
    public List<GrupoCompactoDTO> getGrupos() { return grupos; }
    public void setGrupos(List<GrupoCompactoDTO> grupos) { this.grupos = grupos; }
    public List<DiaCompletoDTO> getDias() { return dias; }
    public void setDias(List<DiaCompletoDTO> dias) { this.dias = dias; }
    public double getRindeTotal() { return rindeTotal; }
    public void setRindeTotal(double rindeTotal) { this.rindeTotal = rindeTotal; }
}
