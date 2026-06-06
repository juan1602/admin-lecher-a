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

import com.smartlech.adminlecheria.dto.DiaCompletoDTO;
import com.smartlech.adminlecheria.dto.DiaGrupoDTO;
import com.smartlech.adminlecheria.dto.GrupoCompactoDTO;
import com.smartlech.adminlecheria.dto.TransporteCompletoDTO;
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

    public TransporteCompletoDTO calcularVistaCompleta(Long quincenaId) {
        Quincena quincena = quincenaRepository.findById(quincenaId)
                .orElseThrow(() -> new RuntimeException("Quincena no encontrada: " + quincenaId));

        List<GrupoRinde> grupos = grupoRindeRepository.findAll();
        List<Recoleccion> todasRecs = recoleccionRepository.findByQuincenaId(quincenaId);
        List<ReciboEmpresa> todosRecibos = reciboEmpresaRepository.findByQuincenaId(quincenaId);

        // ── Lista ordenada de empresas ────────────────────────────────────────
        // Primero las configuradas en grupos (en orden de grupo), luego las demás
        Set<String> yaIncluidas = new LinkedHashSet<>();
        List<String> todasEmpresasOrdenadas = new ArrayList<>();

        for (GrupoRinde g : grupos) {
            for (String emp : g.getEmpresas()) {
                String norm = emp.trim().toLowerCase();
                if (yaIncluidas.add(norm)) todasEmpresasOrdenadas.add(emp.trim());
            }
        }
        for (ReciboEmpresa r : todosRecibos) {
            if (r.getNombreRecibo() != null) {
                String norm = r.getNombreRecibo().trim().toLowerCase();
                if (yaIncluidas.add(norm)) todasEmpresasOrdenadas.add(r.getNombreRecibo().trim());
            }
        }

        // Mapa normalized → nombre canónico
        Map<String, String> normToCanonical = new LinkedHashMap<>();
        for (String emp : todasEmpresasOrdenadas) normToCanonical.put(emp.toLowerCase(), emp);

        // ── Metadata de grupos ────────────────────────────────────────────────
        List<GrupoCompactoDTO> gruposCompactos = new ArrayList<>();
        Map<Long, Set<String>> grupoEmpNorm = new LinkedHashMap<>();
        Map<Long, Set<Long>> grupoRutaIdsMap = new LinkedHashMap<>();
        Map<Long, String> grupoTipoLecheMap = new LinkedHashMap<>();

        for (GrupoRinde g : grupos) {
            Set<String> empNorm = g.getEmpresas().stream()
                    .map(e -> e.trim().toLowerCase()).collect(Collectors.toCollection(LinkedHashSet::new));
            grupoEmpNorm.put(g.getId(), empNorm);
            grupoRutaIdsMap.put(g.getId(), new HashSet<>(g.getRutaIds()));
            grupoTipoLecheMap.put(g.getId(), g.getTipoLeche());

            GrupoCompactoDTO gc = new GrupoCompactoDTO();
            gc.setGrupoId(g.getId());
            gc.setNombre(g.getNombre());
            gc.setTipoLeche(g.getTipoLeche());
            gc.setEmpresasConfig(new ArrayList<>(g.getEmpresas()));
            gruposCompactos.add(gc);
        }

        // ── Recolecciones por día y grupo ─────────────────────────────────────
        Map<LocalDate, Map<Long, Double>> recogidosDiaGrupo = new HashMap<>();
        for (Recoleccion rec : todasRecs) {
            for (GrupoRinde g : grupos) {
                Set<Long> rutaIds = grupoRutaIdsMap.get(g.getId());
                String tl = grupoTipoLecheMap.get(g.getId());
                boolean pertRuta = rutaIds.isEmpty() || rutaIds.contains(rec.getRuta().getId());
                boolean pertLeche = tl == null || tl.isBlank() ||
                        tl.equalsIgnoreCase(rec.getProveedor().getTipoLeche() != null ? rec.getProveedor().getTipoLeche() : "");
                if (pertRuta && pertLeche) {
                    recogidosDiaGrupo.computeIfAbsent(rec.getFecha(), d -> new HashMap<>())
                            .merge(g.getId(), rec.getLitrosRecolectados(), Double::sum);
                }
            }
        }

        // ── Recibos por día ───────────────────────────────────────────────────
        Map<LocalDate, List<ReciboEmpresa>> recibosPorDia = todosRecibos.stream()
                .collect(Collectors.groupingBy(ReciboEmpresa::getFecha));

        // ── Acumuladores de totales por grupo ─────────────────────────────────
        Map<Long, double[]> acc = new HashMap<>(); // [entregado, recogido, valorTransporte, valorProveedor]
        for (GrupoRinde g : grupos) acc.put(g.getId(), new double[4]);

        Map<String, Double> totalLitrosPorEmpresa = new LinkedHashMap<>();
        // Acumuladores financieros por empresa (inicializar junto con litros)
        Map<String, double[]> accEmp   = new LinkedHashMap<>(); // [totalTrans, totalLeche, totalValor]
        Map<String, Double>   precioTransUlt  = new LinkedHashMap<>();
        Map<String, Double>   precioLecheUlt  = new LinkedHashMap<>();
        for (String emp : todasEmpresasOrdenadas) {
            totalLitrosPorEmpresa.put(emp, 0.0);
            accEmp.put(emp, new double[3]);
            precioTransUlt.put(emp, 0.0);
            precioLecheUlt.put(emp, 0.0);
        }

        // ── Construir días ────────────────────────────────────────────────────
        List<DiaCompletoDTO> dias = new ArrayList<>();
        double totalRinde = 0;

        LocalDate fecha = quincena.getFechaInicio();
        while (!fecha.isAfter(quincena.getFechaFin())) {
            List<ReciboEmpresa> recibosDia = recibosPorDia.getOrDefault(fecha, Collections.emptyList());

            // Litros de TODOS los recibos de ese día por empresa
            Map<String, Double> litrosDia = new LinkedHashMap<>();
            for (String emp : todasEmpresasOrdenadas) litrosDia.put(emp, 0.0);
            for (ReciboEmpresa r : recibosDia) {
                if (r.getNombreRecibo() == null) continue;
                String canonical = normToCanonical.get(r.getNombreRecibo().trim().toLowerCase());
                if (canonical == null) continue;
                double litros = r.getLitrosRecibidos() != null ? r.getLitrosRecibidos() : 0;
                double pt = r.getPrecioTransporte() != null ? r.getPrecioTransporte() : 0;
                double pl = r.getPrecioLitro()      != null ? r.getPrecioLitro()      : 0;
                // litros por empresa (tabla diaria y totales)
                litrosDia.merge(canonical, litros, Double::sum);
                totalLitrosPorEmpresa.merge(canonical, litros, Double::sum);
                // precios (último visto)
                if (pt > 0) precioTransUlt.put(canonical, pt);
                if (pl > 0) precioLecheUlt.put(canonical, pl - pt);
                // totales financieros
                double[] ae = accEmp.get(canonical);
                if (ae != null) {
                    ae[0] += litros * pt;
                    ae[1] += litros * (pl - pt);
                    ae[2] += litros * pl;
                }
            }

            // Datos por grupo
            List<DiaGrupoDTO> gruposDia = new ArrayList<>();
            double rindeTotalDia = 0;

            for (GrupoRinde g : grupos) {
                Set<String> empNorm = grupoEmpNorm.get(g.getId());

                double entregado = recibosDia.stream()
                        .filter(r -> r.getNombreRecibo() != null
                                && empNorm.contains(r.getNombreRecibo().trim().toLowerCase())
                                && (r.getSoloTransporte() == null || !r.getSoloTransporte()))
                        .mapToDouble(r -> r.getLitrosRecibidos() != null ? r.getLitrosRecibidos() : 0)
                        .sum();

                double recogido = recogidosDiaGrupo
                        .getOrDefault(fecha, Collections.emptyMap())
                        .getOrDefault(g.getId(), 0.0);

                double rinde = entregado - recogido;
                rindeTotalDia += rinde;

                double[] a = acc.get(g.getId());
                a[0] += entregado;
                a[1] += recogido;
                for (ReciboEmpresa r : recibosDia) {
                    if (r.getNombreRecibo() != null && empNorm.contains(r.getNombreRecibo().trim().toLowerCase())) {
                        double pt = r.getPrecioTransporte() != null ? r.getPrecioTransporte() : 0;
                        double pl = r.getPrecioLitro() != null ? r.getPrecioLitro() : 0;
                        double litros = r.getLitrosRecibidos() != null ? r.getLitrosRecibidos() : 0;
                        a[2] += litros * pt;
                        a[3] += litros * (pl - pt);
                    }
                }

                DiaGrupoDTO dg = new DiaGrupoDTO();
                dg.setGrupoId(g.getId());
                dg.setEntregado(entregado);
                dg.setRecogido(recogido);
                dg.setRinde(rinde);
                gruposDia.add(dg);
            }
            totalRinde += rindeTotalDia;

            DiaCompletoDTO dia = new DiaCompletoDTO();
            dia.setFecha(fecha.toString());
            dia.setLitrosPorEmpresa(litrosDia);
            dia.setGrupos(gruposDia);
            dia.setRindeTotal(rindeTotalDia);
            dias.add(dia);

            fecha = fecha.plusDays(1);
        }

        Map<String, Double> totalTransPorEmp  = new LinkedHashMap<>();
        Map<String, Double> totalLechePorEmp  = new LinkedHashMap<>();
        Map<String, Double> totalValorPorEmp  = new LinkedHashMap<>();
        for (String emp : todasEmpresasOrdenadas) {
            double[] ae = accEmp.get(emp);
            totalTransPorEmp.put(emp,  ae[0]);
            totalLechePorEmp.put(emp,  ae[1]);
            totalValorPorEmp.put(emp,  ae[2]);
        }

        // ── Totales por grupo ──────────────────────────────────────────────────
        double rindeValorTotal = 0;
        for (int i = 0; i < grupos.size(); i++) {
            GrupoCompactoDTO gc = gruposCompactos.get(i);
            double[] a = acc.get(gc.getGrupoId());
            gc.setTotalEntregado(a[0]);
            gc.setTotalRecogido(a[1]);
            gc.setTotalRinde(a[0] - a[1]);
            gc.setTotalValorTransporte(a[2]);
            gc.setTotalValorProveedor(a[3]);
            // Precio promedio por litro (completo) = (trans + proveedor) / entregado
            double precioRinde = a[0] > 0 ? (a[2] + a[3]) / a[0] : 0;
            gc.setPrecioLecheRinde(precioRinde);
            double rindeVal = (a[0] - a[1]) * precioRinde;
            gc.setRindeValorDinero(rindeVal);
            rindeValorTotal += rindeVal;
        }

        // ── Totales globales ───────────────────────────────────────────────────
        double transporteTotal = totalTransPorEmp.values().stream().mapToDouble(Double::doubleValue).sum();
        double pagoTotal       = totalValorPorEmp.values().stream().mapToDouble(Double::doubleValue).sum();

        TransporteCompletoDTO result = new TransporteCompletoDTO();
        result.setQuincenaId(quincenaId);
        result.setTextoQuincena(quincena.getTextoQuincena());
        result.setFechaInicio(quincena.getFechaInicio().toString());
        result.setFechaFin(quincena.getFechaFin().toString());
        result.setTodasEmpresas(todasEmpresasOrdenadas);
        result.setTotalLitrosPorEmpresa(totalLitrosPorEmpresa);
        result.setPrecioTransportePorEmpresa(precioTransUlt);
        result.setTotalTransportePorEmpresa(totalTransPorEmp);
        result.setPrecioLechePorEmpresa(precioLecheUlt);
        result.setTotalLechePorEmpresa(totalLechePorEmp);
        result.setTotalValorPorEmpresa(totalValorPorEmp);
        result.setTransporteTotal(transporteTotal);
        result.setRindeValorTotal(rindeValorTotal);
        result.setPagoTotal(pagoTotal);
        result.setRindeTransporteTotal(transporteTotal + rindeValorTotal);
        result.setGrupos(gruposCompactos);
        result.setDias(dias);
        result.setRindeTotal(totalRinde);
        return result;
    }
}
