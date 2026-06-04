package com.smartlech.adminlecheria.dto;

public class RecoleccionDiariaDTO {
    private String fecha;
    private Double litros;
    private String vale;

    public RecoleccionDiariaDTO(String fecha, Double litros, String vale) {
        this.fecha = fecha;
        this.litros = litros;
        this.vale = vale;
    }

    public String getFecha() { return fecha; }
    public Double getLitros() { return litros; }
    public String getVale() { return vale; }
}
