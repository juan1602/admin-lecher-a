package com.smartlech.adminlecheria.dto;

import java.util.List;
import java.util.Map;

public class TransporteCompletoDTO {
    private Long quincenaId;
    private String textoQuincena;
    private String fechaInicio;
    private String fechaFin;
    private List<String> todasEmpresas;
    // Fila TOTAL LITROS
    private Map<String, Double> totalLitrosPorEmpresa;
    // Fila PRECIO TRANS (último precio visto por empresa)
    private Map<String, Double> precioTransportePorEmpresa;
    // Fila TOTAL TRANS = litros × precioTransporte
    private Map<String, Double> totalTransportePorEmpresa;
    // Fila PRECIO LECHE = precioLitro − precioTransporte (precio al proveedor)
    private Map<String, Double> precioLechePorEmpresa;
    // Fila TOTAL LECHE = litros × (precioLitro − precioTransporte)
    private Map<String, Double> totalLechePorEmpresa;
    // Fila TOTAL = litros × precioLitro completo
    private Map<String, Double> totalValorPorEmpresa;
    // Resumen global
    private double transporteTotal;
    private double rindeValorTotal;
    private double pagoTotal;
    private double rindeTransporteTotal;
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
    public void setTotalLitrosPorEmpresa(Map<String, Double> v) { this.totalLitrosPorEmpresa = v; }
    public Map<String, Double> getPrecioTransportePorEmpresa() { return precioTransportePorEmpresa; }
    public void setPrecioTransportePorEmpresa(Map<String, Double> v) { this.precioTransportePorEmpresa = v; }
    public Map<String, Double> getTotalTransportePorEmpresa() { return totalTransportePorEmpresa; }
    public void setTotalTransportePorEmpresa(Map<String, Double> v) { this.totalTransportePorEmpresa = v; }
    public Map<String, Double> getPrecioLechePorEmpresa() { return precioLechePorEmpresa; }
    public void setPrecioLechePorEmpresa(Map<String, Double> v) { this.precioLechePorEmpresa = v; }
    public Map<String, Double> getTotalLechePorEmpresa() { return totalLechePorEmpresa; }
    public void setTotalLechePorEmpresa(Map<String, Double> v) { this.totalLechePorEmpresa = v; }
    public Map<String, Double> getTotalValorPorEmpresa() { return totalValorPorEmpresa; }
    public void setTotalValorPorEmpresa(Map<String, Double> v) { this.totalValorPorEmpresa = v; }
    public double getTransporteTotal() { return transporteTotal; }
    public void setTransporteTotal(double v) { this.transporteTotal = v; }
    public double getRindeValorTotal() { return rindeValorTotal; }
    public void setRindeValorTotal(double v) { this.rindeValorTotal = v; }
    public double getPagoTotal() { return pagoTotal; }
    public void setPagoTotal(double v) { this.pagoTotal = v; }
    public double getRindeTransporteTotal() { return rindeTransporteTotal; }
    public void setRindeTransporteTotal(double v) { this.rindeTransporteTotal = v; }
    public List<GrupoCompactoDTO> getGrupos() { return grupos; }
    public void setGrupos(List<GrupoCompactoDTO> grupos) { this.grupos = grupos; }
    public List<DiaCompletoDTO> getDias() { return dias; }
    public void setDias(List<DiaCompletoDTO> dias) { this.dias = dias; }
    public double getRindeTotal() { return rindeTotal; }
    public void setRindeTotal(double rindeTotal) { this.rindeTotal = rindeTotal; }
}
