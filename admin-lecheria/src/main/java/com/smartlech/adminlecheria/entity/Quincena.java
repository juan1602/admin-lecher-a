package com.smartlech.adminlecheria.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "quincenas")
public class Quincena {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDate fechaFin;

    @Column(name = "texto_quincena")
    private String textoQuincena;

    @Column(nullable = false)
    private Boolean cerrada = false;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }
    public LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDate fechaFin) { this.fechaFin = fechaFin; }
    public String getTextoQuincena() { return textoQuincena; }
    public void setTextoQuincena(String textoQuincena) { this.textoQuincena = textoQuincena; }
    public Boolean getCerrada() { return cerrada; }
    public void setCerrada(Boolean cerrada) { this.cerrada = cerrada; }
}
