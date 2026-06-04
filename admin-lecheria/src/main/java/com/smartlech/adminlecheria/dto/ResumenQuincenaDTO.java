package com.smartlech.adminlecheria.dto;

import java.util.List;

public class ResumenQuincenaDTO {
    private Long quincenaId;
    private String textoQuincena;
    private String fechaInicio;
    private String fechaFin;
    private int totalProveedores;
    private double totalLitros;
    private double totalValorBruto;
    private double totalDescuentos4x1000;
    private double totalOtrosDescuentos;
    private double totalValorNeto;
    private List<ResumenProveedorDTO> proveedores;

    public Long getQuincenaId() { return quincenaId; }
    public void setQuincenaId(Long quincenaId) { this.quincenaId = quincenaId; }

    public String getTextoQuincena() { return textoQuincena; }
    public void setTextoQuincena(String textoQuincena) { this.textoQuincena = textoQuincena; }

    public String getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(String fechaInicio) { this.fechaInicio = fechaInicio; }

    public String getFechaFin() { return fechaFin; }
    public void setFechaFin(String fechaFin) { this.fechaFin = fechaFin; }

    public int getTotalProveedores() { return totalProveedores; }
    public void setTotalProveedores(int totalProveedores) { this.totalProveedores = totalProveedores; }

    public double getTotalLitros() { return totalLitros; }
    public void setTotalLitros(double totalLitros) { this.totalLitros = totalLitros; }

    public double getTotalValorBruto() { return totalValorBruto; }
    public void setTotalValorBruto(double totalValorBruto) { this.totalValorBruto = totalValorBruto; }

    public double getTotalDescuentos4x1000() { return totalDescuentos4x1000; }
    public void setTotalDescuentos4x1000(double totalDescuentos4x1000) { this.totalDescuentos4x1000 = totalDescuentos4x1000; }

    public double getTotalOtrosDescuentos() { return totalOtrosDescuentos; }
    public void setTotalOtrosDescuentos(double totalOtrosDescuentos) { this.totalOtrosDescuentos = totalOtrosDescuentos; }

    public double getTotalValorNeto() { return totalValorNeto; }
    public void setTotalValorNeto(double totalValorNeto) { this.totalValorNeto = totalValorNeto; }

    public List<ResumenProveedorDTO> getProveedores() { return proveedores; }
    public void setProveedores(List<ResumenProveedorDTO> proveedores) { this.proveedores = proveedores; }
}
