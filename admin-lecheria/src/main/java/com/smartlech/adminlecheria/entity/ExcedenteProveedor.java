package com.smartlech.adminlecheria.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "excedentes_proveedor")
public class ExcedenteProveedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "proveedor_id", nullable = false)
    private Proveedor proveedor;

    @ManyToOne
    @JoinColumn(name = "quincena_id", nullable = false)
    private Quincena quincena;

    @Column(nullable = false)
    private Double valorPorLitro;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Proveedor getProveedor() { return proveedor; }
    public void setProveedor(Proveedor proveedor) { this.proveedor = proveedor; }

    public Quincena getQuincena() { return quincena; }
    public void setQuincena(Quincena quincena) { this.quincena = quincena; }

    public Double getValorPorLitro() { return valorPorLitro; }
    public void setValorPorLitro(Double valorPorLitro) { this.valorPorLitro = valorPorLitro; }
}
