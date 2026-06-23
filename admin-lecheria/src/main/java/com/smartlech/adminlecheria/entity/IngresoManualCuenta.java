package com.smartlech.adminlecheria.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "ingresos_manual_cuenta")
public class IngresoManualCuenta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cuenta_id", nullable = false)
    private CuentaPersonalizada cuenta;

    @ManyToOne
    @JoinColumn(name = "quincena_id", nullable = false)
    private Quincena quincena;

    @Column(nullable = false)
    private String descripcion;

    @Column(nullable = false)
    private Double valor;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CuentaPersonalizada getCuenta() { return cuenta; }
    public void setCuenta(CuentaPersonalizada cuenta) { this.cuenta = cuenta; }

    public Quincena getQuincena() { return quincena; }
    public void setQuincena(Quincena quincena) { this.quincena = quincena; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public Double getValor() { return valor; }
    public void setValor(Double valor) { this.valor = valor; }
}
