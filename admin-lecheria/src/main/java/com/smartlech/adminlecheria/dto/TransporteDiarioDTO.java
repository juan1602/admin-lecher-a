package com.smartlech.adminlecheria.dto;

import java.util.List;

public class TransporteDiarioDTO {
    private String fecha;
    private double litrosRecogidos;
    private double litrosEntregados;
    private double rinde;
    private List<EntregaDiariaEmpresaDTO> empresas;

    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }
    public double getLitrosRecogidos() { return litrosRecogidos; }
    public void setLitrosRecogidos(double litrosRecogidos) { this.litrosRecogidos = litrosRecogidos; }
    public double getLitrosEntregados() { return litrosEntregados; }
    public void setLitrosEntregados(double litrosEntregados) { this.litrosEntregados = litrosEntregados; }
    public double getRinde() { return rinde; }
    public void setRinde(double rinde) { this.rinde = rinde; }
    public List<EntregaDiariaEmpresaDTO> getEmpresas() { return empresas; }
    public void setEmpresas(List<EntregaDiariaEmpresaDTO> empresas) { this.empresas = empresas; }
}
