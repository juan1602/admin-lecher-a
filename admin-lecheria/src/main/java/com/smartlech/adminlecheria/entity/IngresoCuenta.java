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
    @JoinColumn(name = "recibo_id", nullable = false)
    private ReciboEmpresa recibo;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CuentaPersonalizada getCuenta() { return cuenta; }
    public void setCuenta(CuentaPersonalizada cuenta) { this.cuenta = cuenta; }

    public ReciboEmpresa getRecibo() { return recibo; }
    public void setRecibo(ReciboEmpresa recibo) { this.recibo = recibo; }
}
