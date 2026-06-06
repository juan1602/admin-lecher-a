package com.smartlech.adminlecheria.dto;

import java.util.List;

public class RindeGrupoDTO {

    private Long grupoId;
    private String nombre;
    private String tipoLeche;
    private List<Long> rutaIds;
    private List<String> rutaNombres;
    // Empresas configuradas en el grupo (para editar el formulario)
    private List<String> configEmpresas;
    // Empresas que realmente tienen datos en la quincena (para headers de tabla)
    private List<String> empresas;
    private double totalRecogidos;
    private double totalEntregados;
    private double rinde;
    private double totalValorTransporte;
    private double totalValorProveedor;
    private List<TransporteDiarioDTO> dias;

    public Long getGrupoId() { return grupoId; }
    public void setGrupoId(Long grupoId) { this.grupoId = grupoId; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getTipoLeche() { return tipoLeche; }
    public void setTipoLeche(String tipoLeche) { this.tipoLeche = tipoLeche; }

    public List<Long> getRutaIds() { return rutaIds; }
    public void setRutaIds(List<Long> rutaIds) { this.rutaIds = rutaIds; }

    public List<String> getRutaNombres() { return rutaNombres; }
    public void setRutaNombres(List<String> rutaNombres) { this.rutaNombres = rutaNombres; }

    public List<String> getConfigEmpresas() { return configEmpresas; }
    public void setConfigEmpresas(List<String> configEmpresas) { this.configEmpresas = configEmpresas; }

    public List<String> getEmpresas() { return empresas; }
    public void setEmpresas(List<String> empresas) { this.empresas = empresas; }

    public double getTotalRecogidos() { return totalRecogidos; }
    public void setTotalRecogidos(double totalRecogidos) { this.totalRecogidos = totalRecogidos; }

    public double getTotalEntregados() { return totalEntregados; }
    public void setTotalEntregados(double totalEntregados) { this.totalEntregados = totalEntregados; }

    public double getRinde() { return rinde; }
    public void setRinde(double rinde) { this.rinde = rinde; }

    public double getTotalValorTransporte() { return totalValorTransporte; }
    public void setTotalValorTransporte(double totalValorTransporte) { this.totalValorTransporte = totalValorTransporte; }

    public double getTotalValorProveedor() { return totalValorProveedor; }
    public void setTotalValorProveedor(double totalValorProveedor) { this.totalValorProveedor = totalValorProveedor; }

    public List<TransporteDiarioDTO> getDias() { return dias; }
    public void setDias(List<TransporteDiarioDTO> dias) { this.dias = dias; }
}
