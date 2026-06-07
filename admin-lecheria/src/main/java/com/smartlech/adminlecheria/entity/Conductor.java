package com.smartlech.adminlecheria.entity;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "conductores")
public class Conductor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    private String telefono;

    @Column(nullable = false)
    private Boolean activo = true;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "conductor_rutas", joinColumns = @JoinColumn(name = "conductor_id"))
    @Column(name = "ruta_id")
    private Set<Long> rutaIds = new HashSet<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public Set<Long> getRutaIds() { return rutaIds; }
    public void setRutaIds(Set<Long> rutaIds) { this.rutaIds = rutaIds != null ? rutaIds : new HashSet<>(); }
}
