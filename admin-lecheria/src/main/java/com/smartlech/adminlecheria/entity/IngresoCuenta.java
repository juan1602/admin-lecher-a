package com.smartlech.adminlecheria.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "ingresos_cuenta")
public class IngresoCuenta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cuenta_id", nullable = false)
    private CuentaPersonalizada cuenta;

    @ManyToOne
    @JoinColumn(name = "quincena_id", nullable = false)
    private Quincena quincena;

    // Nombre de la empresa/recibo — agrupa todos los registros diarios de ese nombre
    @Column(name = "nombre_recibo", nullable = false)
    private String nombreRecibo;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CuentaPersonalizada getCuenta() { return cuenta; }
    public void setCuenta(CuentaPersonalizada cuenta) { this.cuenta = cuenta; }

    public Quincena getQuincena() { return quincena; }
    public void setQuincena(Quincena quincena) { this.quincena = quincena; }

    public String getNombreRecibo() { return nombreRecibo; }
    public void setNombreRecibo(String nombreRecibo) { this.nombreRecibo = nombreRecibo; }
}
