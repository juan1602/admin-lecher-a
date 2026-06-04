package com.smartlech.adminlecheria.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "recibos_detalle")
public class ReciboDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "recibo_id", nullable = false)
    private ReciboEmpresa recibo;

    @ManyToOne
    @JoinColumn(name = "proveedor_id", nullable = false)
    private Proveedor proveedor;

    @Column(name = "litros_asignados", nullable = false)
    private Double litrosAsignados;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ReciboEmpresa getRecibo() { return recibo; }
    public void setRecibo(ReciboEmpresa recibo) { this.recibo = recibo; }
    public Proveedor getProveedor() { return proveedor; }
    public void setProveedor(Proveedor proveedor) { this.proveedor = proveedor; }
    public Double getLitrosAsignados() { return litrosAsignados; }
    public void setLitrosAsignados(Double litrosAsignados) { this.litrosAsignados = litrosAsignados; }
}
