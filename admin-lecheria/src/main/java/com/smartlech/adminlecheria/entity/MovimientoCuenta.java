package com.smartlech.adminlecheria.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "movimientos_cuenta")
public class MovimientoCuenta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cuenta_id", nullable = false)
    private CuentaPersonalizada cuenta;

    @Column(nullable = false)
    private String descripcion;

    @Column(nullable = false)
    private Double valor;

    // "INGRESO" o "DESCUENTO"
    @Column(nullable = false)
    private String tipo;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CuentaPersonalizada getCuenta() { return cuenta; }
    public void setCuenta(CuentaPersonalizada cuenta) { this.cuenta = cuenta; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public Double getValor() { return valor; }
    public void setValor(Double valor) { this.valor = valor; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
}
