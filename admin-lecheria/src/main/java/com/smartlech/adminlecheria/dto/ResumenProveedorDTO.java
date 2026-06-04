package com.smartlech.adminlecheria.dto;

import java.util.List;

public class ResumenProveedorDTO {

    private Long proveedorId;
    private String nombre;
    private String zona;
    private String tipoLeche;
    private String conductores;
    private int diasRecolectados;
    private double totalLitros;
    private double precioLitro;
    private double valorBruto;
    private double cuotaLitros;
    private double descuento4x1000;
    private List<DescuentoDetalleDTO> otrosDescuentos;
    private double totalOtrosDescuentos;
    private double valorNeto;
    private List<RecoleccionDiariaDTO> recolecciones;

    public Long getProveedorId() { return proveedorId; }
    public void setProveedorId(Long proveedorId) { this.proveedorId = proveedorId; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getZona() { return zona; }
    public void setZona(String zona) { this.zona = zona; }

    public String getTipoLeche() { return tipoLeche; }
    public void setTipoLeche(String tipoLeche) { this.tipoLeche = tipoLeche; }

    public int getDiasRecolectados() { return diasRecolectados; }
    public void setDiasRecolectados(int diasRecolectados) { this.diasRecolectados = diasRecolectados; }

    public double getTotalLitros() { return totalLitros; }
    public void setTotalLitros(double totalLitros) { this.totalLitros = totalLitros; }

    public double getPrecioLitro() { return precioLitro; }
    public void setPrecioLitro(double precioLitro) { this.precioLitro = precioLitro; }

    public double getValorBruto() { return valorBruto; }
    public void setValorBruto(double valorBruto) { this.valorBruto = valorBruto; }

    public double getCuotaLitros() { return cuotaLitros; }
    public void setCuotaLitros(double cuotaLitros) { this.cuotaLitros = cuotaLitros; }

    public double getDescuento4x1000() { return descuento4x1000; }
    public void setDescuento4x1000(double descuento4x1000) { this.descuento4x1000 = descuento4x1000; }

    public List<DescuentoDetalleDTO> getOtrosDescuentos() { return otrosDescuentos; }
    public void setOtrosDescuentos(List<DescuentoDetalleDTO> otrosDescuentos) { this.otrosDescuentos = otrosDescuentos; }

    public double getTotalOtrosDescuentos() { return totalOtrosDescuentos; }
    public void setTotalOtrosDescuentos(double totalOtrosDescuentos) { this.totalOtrosDescuentos = totalOtrosDescuentos; }

    public double getValorNeto() { return valorNeto; }
    public void setValorNeto(double valorNeto) { this.valorNeto = valorNeto; }

    public String getConductores() { return conductores; }
    public void setConductores(String conductores) { this.conductores = conductores; }

    public List<RecoleccionDiariaDTO> getRecolecciones() { return recolecciones; }
    public void setRecolecciones(List<RecoleccionDiariaDTO> recolecciones) { this.recolecciones = recolecciones; }
}
