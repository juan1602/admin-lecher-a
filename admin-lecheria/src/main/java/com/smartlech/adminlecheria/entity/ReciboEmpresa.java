package com.smartlech.adminlecheria.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "recibos_empresa")
public class ReciboEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "quincena_id", nullable = false)
    private Quincena quincena;

    @Column(name = "nombre_recibo", nullable = false)
    private String nombreRecibo;

    @Column(name = "litros_recibidos", nullable = false)
    private Double litrosRecibidos;

    @Column(name = "precio_litro", nullable = false)
    private Double precioLitro;

    @Column(name = "precio_transporte")
    private Double precioTransporte;

    @Column(name = "solo_transporte", nullable = false)
    private Boolean soloTransporte = false;

    @Column(nullable = false)
    private LocalDate fecha;

    @OneToMany(mappedBy = "recibo", cascade = CascadeType.ALL)
    private List<ReciboDetalle> detalles;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Quincena getQuincena() { return quincena; }
    public void setQuincena(Quincena quincena) { this.quincena = quincena; }
    public String getNombreRecibo() { return nombreRecibo; }
    public void setNombreRecibo(String nombreRecibo) { this.nombreRecibo = nombreRecibo; }
    public Double getLitrosRecibidos() { return litrosRecibidos; }
    public void setLitrosRecibidos(Double litrosRecibidos) { this.litrosRecibidos = litrosRecibidos; }
    public Double getPrecioLitro() { return precioLitro; }
    public void setPrecioLitro(Double precioLitro) { this.precioLitro = precioLitro; }
    public Double getPrecioTransporte() { return precioTransporte; }
    public void setPrecioTransporte(Double precioTransporte) { this.precioTransporte = precioTransporte; }
    public Boolean getSoloTransporte() { return soloTransporte; }
    public void setSoloTransporte(Boolean soloTransporte) { this.soloTransporte = soloTransporte != null && soloTransporte; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public List<ReciboDetalle> getDetalles() { return detalles; }
    public void setDetalles(List<ReciboDetalle> detalles) { this.detalles = detalles; }
}
