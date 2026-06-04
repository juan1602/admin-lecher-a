package com.smartlech.adminlecheria.dto;

public class EntregaDiariaEmpresaDTO {
    private String nombre;
    private double litros;
    private double precioLitro;
    private double precioTransporte;
    private double valorTotal;
    private double valorTransporte;
    private double valorProveedor;

    public EntregaDiariaEmpresaDTO() {}

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public double getLitros() { return litros; }
    public void setLitros(double litros) { this.litros = litros; }
    public double getPrecioLitro() { return precioLitro; }
    public void setPrecioLitro(double precioLitro) { this.precioLitro = precioLitro; }
    public double getPrecioTransporte() { return precioTransporte; }
    public void setPrecioTransporte(double precioTransporte) { this.precioTransporte = precioTransporte; }
    public double getValorTotal() { return valorTotal; }
    public void setValorTotal(double valorTotal) { this.valorTotal = valorTotal; }
    public double getValorTransporte() { return valorTransporte; }
    public void setValorTransporte(double valorTransporte) { this.valorTransporte = valorTransporte; }
    public double getValorProveedor() { return valorProveedor; }
    public void setValorProveedor(double valorProveedor) { this.valorProveedor = valorProveedor; }
}
