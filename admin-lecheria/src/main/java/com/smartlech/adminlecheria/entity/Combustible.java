package com.smartlech.adminlecheria.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "combustibles")
public class Combustible {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "quincena_id", nullable = false)
    private Quincena quincena;

    @Column(nullable = false)
    private String descripcion;

    @Column(nullable = false)
    private Double valor;

    // IDs de rutas ordenadas y separadas por coma, ej: "1,2" o "3"
    @Column
    private String rutaContexto;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Quincena getQuincena() { return quincena; }
    public void setQuincena(Quincena quincena) { this.quincena = quincena; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public Double getValor() { return valor; }
    public void setValor(Double valor) { this.valor = valor; }

    public String getRutaContexto() { return rutaContexto; }
    public void setRutaContexto(String rutaContexto) { this.rutaContexto = rutaContexto; }
}
