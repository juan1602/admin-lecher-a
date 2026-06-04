package com.smartlech.adminlecheria.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "proveedores")

public class Proveedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ruta_id")
    private Ruta ruta;

    @Column(nullable = false)
    private String nombre;

    private String zona;

    @Column(name = "precio_litro")
    private Double precioLitro;

    @Column(name = "cuota_litros")
    private Double cuotaLitros;

    @Column(name = "tipo_leche")
    private String tipoLeche;

    @Column(nullable = false)
    private Boolean activo = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getZona() { return zona; }
    public void setZona(String zona) { this.zona = zona; }

    public Double getPrecioLitro() { return precioLitro; }
    public void setPrecioLitro(Double precioLitro) { this.precioLitro = precioLitro; }

    public Double getCuotaLitros() { return cuotaLitros; }
    public void setCuotaLitros(Double cuotaLitros) { this.cuotaLitros = cuotaLitros; }

    public String getTipoLeche() { return tipoLeche; }
    public void setTipoLeche(String tipoLeche) { this.tipoLeche = tipoLeche; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public Ruta getRuta() { return ruta; }
public void setRuta(Ruta ruta) { this.ruta = ruta; }
}