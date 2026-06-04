package com.smartlech.adminlecheria.dto;

import java.util.List;

public class TransporteResumenDTO {
    private Long quincenaId;
    private String textoQuincena;
    private String fechaInicio;
    private String fechaFin;
    private List<String> empresas;
    private List<TransporteDiarioDTO> dias;
    private double totalLitrosRecogidos;
    private double totalLitrosEntregados;
    private double totalRinde;
    private double totalValorTransporte;
    private double totalValorProveedor;

    public Long getQuincenaId() { return quincenaId; }
    public void setQuincenaId(Long quincenaId) { this.quincenaId = quincenaId; }
    public String getTextoQuincena() { return textoQuincena; }
    public void setTextoQuincena(String textoQuincena) { this.textoQuincena = textoQuincena; }
    public String getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(String fechaInicio) { this.fechaInicio = fechaInicio; }
    public String getFechaFin() { return fechaFin; }
    public void setFechaFin(String fechaFin) { this.fechaFin = fechaFin; }
    public List<String> getEmpresas() { return empresas; }
    public void setEmpresas(List<String> empresas) { this.empresas = empresas; }
    public List<TransporteDiarioDTO> getDias() { return dias; }
    public void setDias(List<TransporteDiarioDTO> dias) { this.dias = dias; }
    public double getTotalLitrosRecogidos() { return totalLitrosRecogidos; }
    public void setTotalLitrosRecogidos(double totalLitrosRecogidos) { this.totalLitrosRecogidos = totalLitrosRecogidos; }
    public double getTotalLitrosEntregados() { return totalLitrosEntregados; }
    public void setTotalLitrosEntregados(double totalLitrosEntregados) { this.totalLitrosEntregados = totalLitrosEntregados; }
    public double getTotalRinde() { return totalRinde; }
    public void setTotalRinde(double totalRinde) { this.totalRinde = totalRinde; }
    public double getTotalValorTransporte() { return totalValorTransporte; }
    public void setTotalValorTransporte(double totalValorTransporte) { this.totalValorTransporte = totalValorTransporte; }
    public double getTotalValorProveedor() { return totalValorProveedor; }
    public void setTotalValorProveedor(double totalValorProveedor) { this.totalValorProveedor = totalValorProveedor; }
}
