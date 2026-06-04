package com.smartlech.adminlecheria.dto;

public class DescuentoDetalleDTO {
    private Long id;
    private String concepto;
    private double valor;

    public DescuentoDetalleDTO(Long id, String concepto, double valor) {
        this.id = id;
        this.concepto = concepto;
        this.valor = valor;
    }

    public Long getId() { return id; }
    public String getConcepto() { return concepto; }
    public double getValor() { return valor; }
}
