package com.smartlech.adminlecheria.service;

import com.smartlech.adminlecheria.dto.EntregaDiariaEmpresaDTO;
import com.smartlech.adminlecheria.dto.RindeGrupoDTO;
import com.smartlech.adminlecheria.dto.TransporteDiarioDTO;
import com.smartlech.adminlecheria.entity.GrupoRinde;
import com.smartlech.adminlecheria.entity.Quincena;
import com.smartlech.adminlecheria.entity.Recoleccion;
import com.smartlech.adminlecheria.entity.ReciboEmpresa;
import com.smartlech.adminlecheria.entity.Ruta;
import com.smartlech.adminlecheria.repository.GrupoRindeRepository;
import com.smartlech.adminlecheria.repository.QuincenaRepository;
import com.smartlech.adminlecheria.repository.ReciboEmpresaRepository;
import com.smartlech.adminlecheria.repository.RecoleccionRepository;
import com.smartlech.adminlecheria.repository.RutaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GrupoRindeService {

    private final GrupoRindeRepository grupoRindeRepository;
    private final QuincenaRepository quincenaRepository;
    private final RecoleccionRepository recoleccionRepository;
    private final ReciboEmpresaRepository reciboEmpresaRepository;
    private final RutaRepository rutaRepository;

    public List<GrupoRinde> listar() {
        return grupoRindeRepository.findAll();
    }

    public GrupoRinde guardar(GrupoRinde grupo) {
        return grupoRindeRepository.save(grupo);
    }

    public void eliminar(Long id) {
        grupoRindeRepository.deleteById(id);
    }

    public List<RindeGrupoDTO> calcularRindePorGrupo(Long quincenaId) {
        Quincena quincena = quincenaRepository.findById(quincenaId)
                .orElseThrow(() -> new RuntimeException("Quincena no encontrada: " + quincenaId));

        List<GrupoRinde> grupos = grupoRindeRepository.findAll();
        List<Recoleccion> todasRecs = recoleccionRepository.findByQuincenaId(quincenaId);
        List<ReciboEmpresa> todosRecibos = reciboEmpresaRepository.findByQuincenaId(quincenaId);

        // Mapa id → nombre de ruta para display
        Map<Long, String> rutaNombresMap = rutaRepository.findAll().stream()
                .collect(Collectors.toMap(Ruta::getId, Ruta::getNombre));

        List<RindeGrupoDTO> result = new ArrayList<>();

        for (GrupoRinde grupo : grupos) {
            // Normalizar empresas configuradas para comparación case-insensitive
            Set<String> empresasNorm = grupo.getEmpresas().stream()
                    .map(e -> e.trim().toLowerCase())
                    .collect(Collectors.toSet());

            // Filtrar recolecciones del grupo
            List<Recoleccion> recsFiltradas = todasRecs.stream()
                    .filter(r -> grupo.getRutaIds().isEmpty()
                            || grupo.getRutaIds().contains(r.getRuta().getId()))
                    .filter(r -> {
                        if (grupo.getTipoLeche() == null || grupo.getTipoLeche().isBlank()) return true;
                        String tl = r.getProveedor().getTipoLeche();
                        return grupo.getTipoLeche().equalsIgnoreCase(tl != null ? tl : "");
                    })
                    .collect(Collectors.toList());

            // Filtrar recibos del grupo
            List<ReciboEmpresa> recibosFiltrados = todosRecibos.stream()
                    .filter(r -> r.getNombreRecibo() != null
                            && empresasNorm.contains(r.getNombreRecibo().trim().toLowerCase()))
                    .collect(Collectors.toList());

            // Agrupar por fecha
            Map<LocalDate, Double> recogidosPorDia = recsFiltradas.stream()
                    .collect(Collectors.groupingBy(Recoleccion::getFecha,
                            Collectors.summingDouble(Recoleccion::getLitrosRecolectados)));

            Map<LocalDate, List<ReciboEmpresa>> recibosPorDia = recibosFiltrados.stream()
                    .collect(Collectors.groupingBy(ReciboEmpresa::getFecha));

            // Construir tabla día a día
            List<TransporteDiarioDTO> dias = new ArrayList<>();
            LocalDate fecha = quincena.getFechaInicio();
            while (!fecha.isAfter(quincena.getFechaFin())) {
                double litrosRecogidos = recogidosPorDia.getOrDefault(fecha, 0.0);
                List<ReciboEmpresa> recibosDia = recibosPorDia.getOrDefault(fecha, Collections.emptyList());

                Map<String, List<ReciboEmpresa>> porEmpresaDia = recibosDia.stream()
                        .filter(r -> r.getNombreRecibo() != null)
                        .collect(Collectors.groupingBy(r -> r.getNombreRecibo().trim().toLowerCase()));

                List<EntregaDiariaEmpresaDTO> empresasDia = porEmpresaDia.entrySet().stream()
                        .map(e -> {
                            List<ReciboEmpresa> grupo2 = e.getValue();
                            ReciboEmpresa primero = grupo2.get(0);
                            double litrosGrupo = grupo2.stream()
                                    .mapToDouble(r -> r.getLitrosRecibidos() != null ? r.getLitrosRecibidos() : 0).sum();
                            double pl = primero.getPrecioLitro() != null ? primero.getPrecioLitro() : 0;
                            double pt = primero.getPrecioTransporte() != null ? primero.getPrecioTransporte() : 0;
                            EntregaDiariaEmpresaDTO dto = new EntregaDiariaEmpresaDTO();
                            dto.setNombre(primero.getNombreRecibo().trim());
                            dto.setLitros(litrosGrupo);
                            dto.setPrecioLitro(pl);
                            dto.setPrecioTransporte(pt);
                            dto.setValorTotal(litrosGrupo * pl);
                            dto.setValorTransporte(litrosGrupo * pt);
                            dto.setValorProveedor(litrosGrupo * (pl - pt));
                            return dto;
                        })
                        .sorted(Comparator.comparing(EntregaDiariaEmpresaDTO::getNombre))
                        .collect(Collectors.toList());

                // Solo cuentan para entregado los recibos que NO son soloTransporte
                double litrosEntregados = recibosDia.stream()
                        .filter(r -> r.getSoloTransporte() == null || !r.getSoloTransporte())
                        .mapToDouble(r -> r.getLitrosRecibidos() != null ? r.getLitrosRecibidos() : 0)
                        .sum();

                TransporteDiarioDTO dia = new TransporteDiarioDTO();
                dia.setFecha(fecha.toString());
                dia.setLitrosRecogidos(litrosRecogidos);
                dia.setLitrosEntregados(litrosEntregados);
                dia.setRinde(litrosEntregados - litrosRecogidos);
                dia.setEmpresas(empresasDia);
                dias.add(dia);

                fecha = fecha.plusDays(1);
            }

            double totalRecogidos = dias.stream().mapToDouble(TransporteDiarioDTO::getLitrosRecogidos).sum();
            double totalEntregados = dias.stream().mapToDouble(TransporteDiarioDTO::getLitrosEntregados).sum();

            double totalValorTransporte = recibosFiltrados.stream().mapToDouble(r -> {
                double pt = r.getPrecioTransporte() != null ? r.getPrecioTransporte() : 0;
                return (r.getLitrosRecibidos() != null ? r.getLitrosRecibidos() : 0) * pt;
            }).sum();

            double totalValorProveedor = recibosFiltrados.stream().mapToDouble(r -> {
                double pl = r.getPrecioLitro() != null ? r.getPrecioLitro() : 0;
                double pt = r.getPrecioTransporte() != null ? r.getPrecioTransporte() : 0;
                return (r.getLitrosRecibidos() != null ? r.getLitrosRecibidos() : 0) * (pl - pt);
            }).sum();

            // Empresas distintas que tienen datos (para headers de tabla)
            List<String> empresasConDatos = recibosFiltrados.stream()
                    .filter(r -> r.getNombreRecibo() != null)
                    .collect(Collectors.groupingBy(r -> r.getNombreRecibo().trim().toLowerCase()))
                    .entrySet().stream()
                    .sorted(Map.Entry.comparingByKey())
                    .map(e -> e.getValue().get(0).getNombreRecibo().trim())
                    .collect(Collectors.toList());

            RindeGrupoDTO dto = new RindeGrupoDTO();
            dto.setGrupoId(grupo.getId());
            dto.setNombre(grupo.getNombre());
            dto.setTipoLeche(grupo.getTipoLeche());
            dto.setRutaIds(grupo.getRutaIds());
            dto.setRutaNombres(grupo.getRutaIds().stream()
                    .map(id -> rutaNombresMap.getOrDefault(id, "?"))
                    .collect(Collectors.toList()));
            dto.setConfigEmpresas(grupo.getEmpresas());
            dto.setEmpresas(empresasConDatos);
            dto.setTotalRecogidos(totalRecogidos);
            dto.setTotalEntregados(totalEntregados);
            dto.setRinde(totalEntregados - totalRecogidos);
            dto.setTotalValorTransporte(totalValorTransporte);
            dto.setTotalValorProveedor(totalValorProveedor);
            dto.setDias(dias);
            result.add(dto);
        }

        return result;
    }
}
