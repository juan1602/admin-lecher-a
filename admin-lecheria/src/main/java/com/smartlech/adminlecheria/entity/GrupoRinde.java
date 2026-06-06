package com.smartlech.adminlecheria.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "grupos_rinde")
public class GrupoRinde {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    // null o vacío = todos los tipos, "vaca" o "bufala" para filtrar
    @Column(name = "tipo_leche")
    private String tipoLeche;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "grupo_rinde_rutas", joinColumns = @JoinColumn(name = "grupo_id"))
    @Column(name = "ruta_id")
    private List<Long> rutaIds = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "grupo_rinde_empresas", joinColumns = @JoinColumn(name = "grupo_id"))
    @Column(name = "empresa")
    private List<String> empresas = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getTipoLeche() { return tipoLeche; }
    public void setTipoLeche(String tipoLeche) { this.tipoLeche = tipoLeche; }

    public List<Long> getRutaIds() { return rutaIds; }
    public void setRutaIds(List<Long> rutaIds) { this.rutaIds = rutaIds; }

    public List<String> getEmpresas() { return empresas; }
    public void setEmpresas(List<String> empresas) { this.empresas = empresas; }
}
