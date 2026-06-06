package com.smartlech.adminlecheria.dto;

public class DiaGrupoDTO {
    private Long grupoId;
    private double entregado;
    private double recogido;
    private double rinde;

    public Long getGrupoId() { return grupoId; }
    public void setGrupoId(Long grupoId) { this.grupoId = grupoId; }
    public double getEntregado() { return entregado; }
    public void setEntregado(double entregado) { this.entregado = entregado; }
    public double getRecogido() { return recogido; }
    public void setRecogido(double recogido) { this.recogido = recogido; }
    public double getRinde() { return rinde; }
    public void setRinde(double rinde) { this.rinde = rinde; }
}
