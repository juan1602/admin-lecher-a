package com.smartlech.adminlecheria.dto;

import java.util.List;

public class GrupoCompactoDTO {
    private Long grupoId;
    private String nombre;
    private String tipoLeche;
    private List<String> empresasConfig;
    private double totalEntregado;
    private double totalRecogido;
    private double totalRinde;
    private double totalValorTransporte;
    private double totalValorProveedor;
    // Precio promedio por litro (precioLitro completo) para valorizar el rinde
    private double precioLecheRinde;
    // Valor en dinero del rinde = totalRinde × precioLecheRinde
    private double rindeValorDinero;

    public Long getGrupoId() { return grupoId; }
    public void setGrupoId(Long grupoId) { this.grupoId = grupoId; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getTipoLeche() { return tipoLeche; }
    public void setTipoLeche(String tipoLeche) { this.tipoLeche = tipoLeche; }
    public List<String> getEmpresasConfig() { return empresasConfig; }
    public void setEmpresasConfig(List<String> empresasConfig) { this.empresasConfig = empresasConfig; }
    public double getTotalEntregado() { return totalEntregado; }
    public void setTotalEntregado(double totalEntregado) { this.totalEntregado = totalEntregado; }
    public double getTotalRecogido() { return totalRecogido; }
    public void setTotalRecogido(double totalRecogido) { this.totalRecogido = totalRecogido; }
    public double getTotalRinde() { return totalRinde; }
    public void setTotalRinde(double totalRinde) { this.totalRinde = totalRinde; }
    public double getTotalValorTransporte() { return totalValorTransporte; }
    public void setTotalValorTransporte(double v) { this.totalValorTransporte = v; }
    public double getTotalValorProveedor() { return totalValorProveedor; }
    public void setTotalValorProveedor(double v) { this.totalValorProveedor = v; }
    public double getPrecioLecheRinde() { return precioLecheRinde; }
    public void setPrecioLecheRinde(double v) { this.precioLecheRinde = v; }
    public double getRindeValorDinero() { return rindeValorDinero; }
    public void setRindeValorDinero(double v) { this.rindeValorDinero = v; }
}
