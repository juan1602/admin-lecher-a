package com.smartlech.adminlecheria.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "descuentos_cuenta")
public class DescuentoCuenta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "quincena_id", nullable = false)
    private Quincena quincena;

    // "TRANSPORTE" o "RINDE"
    @Column(nullable = false)
    private String tipo;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private Double valor;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Quincena getQuincena() { return quincena; }
    public void setQuincena(Quincena quincena) { this.quincena = quincena; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public Double getValor() { return valor; }
    public void setValor(Double valor) { this.valor = valor; }
}
