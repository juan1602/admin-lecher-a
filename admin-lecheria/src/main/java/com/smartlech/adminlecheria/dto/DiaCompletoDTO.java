package com.smartlech.adminlecheria.dto;

import java.util.List;
import java.util.Map;

public class DiaCompletoDTO {
    private String fecha;
    // Litros de TODOS los recibos de ese día, key = nombreEmpresa
    private Map<String, Double> litrosPorEmpresa;
    // Resumen por grupo (entregado, recogido, rinde)
    private List<DiaGrupoDTO> grupos;
    private double rindeTotal;

    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }
    public Map<String, Double> getLitrosPorEmpresa() { return litrosPorEmpresa; }
    public void setLitrosPorEmpresa(Map<String, Double> litrosPorEmpresa) { this.litrosPorEmpresa = litrosPorEmpresa; }
    public List<DiaGrupoDTO> getGrupos() { return grupos; }
    public void setGrupos(List<DiaGrupoDTO> grupos) { this.grupos = grupos; }
    public double getRindeTotal() { return rindeTotal; }
    public void setRindeTotal(double rindeTotal) { this.rindeTotal = rindeTotal; }
}
