package com.smartlech.adminlecheria.service;

import com.smartlech.adminlecheria.dto.EntregaDiariaEmpresaDTO;
import com.smartlech.adminlecheria.dto.TransporteDiarioDTO;
import com.smartlech.adminlecheria.dto.TransporteResumenDTO;
import com.smartlech.adminlecheria.entity.Quincena;
import com.smartlech.adminlecheria.entity.Recoleccion;
import com.smartlech.adminlecheria.entity.ReciboEmpresa;
import com.smartlech.adminlecheria.entity.Ruta;
import com.smartlech.adminlecheria.repository.QuincenaRepository;
import com.smartlech.adminlecheria.repository.ReciboEmpresaRepository;
import com.smartlech.adminlecheria.repository.RecoleccionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReciboEmpresaService {

    private final ReciboEmpresaRepository reciboEmpresaRepository;
    private final RecoleccionRepository recoleccionRepository;
    private final QuincenaRepository quincenaRepository;

    public List<ReciboEmpresa> listarPorQuincena(Long quincenaId) {
        return reciboEmpresaRepository.findByQuincenaId(quincenaId);
    }

    public ReciboEmpresa guardar(ReciboEmpresa recibo) {
        // Validar que no exista ya un recibo para la misma empresa en el mismo día
        if (recibo.getId() == null && recibo.getNombreRecibo() != null && recibo.getFecha() != null) {
            List<ReciboEmpresa> existentes = reciboEmpresaRepository.findByQuincenaId(recibo.getQuincena().getId());
            boolean yaExiste = existentes.stream().anyMatch(r ->
                r.getNombreRecibo() != null &&
                r.getNombreRecibo().trim().equalsIgnoreCase(recibo.getNombreRecibo().trim()) &&
                r.getFecha() != null &&
                r.getFecha().equals(recibo.getFecha())
            );
            if (yaExiste) {
                throw new RuntimeException("Ya existe un recibo para '"
                    + recibo.getNombreRecibo() + "' en la fecha " + recibo.getFecha());
            }
        }
        return reciboEmpresaRepository.save(recibo);
    }

    public ReciboEmpresa buscarPorId(Long id) {
        return reciboEmpresaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recibo no encontrado: " + id));
    }

    public void eliminar(Long id) {
        reciboEmpresaRepository.deleteById(id);
    }

    public List<String> listarEmpresasDistintas() {
        return reciboEmpresaRepository.findNombresDistintos();
    }

    public void propagarRuta(Long quincenaId, String nombreRecibo, Ruta ruta) {
        List<ReciboEmpresa> todos = reciboEmpresaRepository.findByQuincenaId(quincenaId);
        for (ReciboEmpresa r : todos) {
            if (r.getNombreRecibo() != null &&
                r.getNombreRecibo().trim().equalsIgnoreCase(nombreRecibo.trim())) {
                r.setRuta(ruta);
                reciboEmpresaRepository.save(r);
            }
        }
    }

    public void propagarPrecio(Long quincenaId, String nombreRecibo,
                               Double precioLitro, Double precioTransporte, Boolean soloTransporte) {
        List<ReciboEmpresa> todos = reciboEmpresaRepository.findByQuincenaId(quincenaId);
        for (ReciboEmpresa r : todos) {
            if (r.getNombreRecibo() != null &&
                r.getNombreRecibo().trim().equalsIgnoreCase(nombreRecibo.trim())) {
                r.setPrecioLitro(precioLitro);
                r.setPrecioTransporte(precioTransporte);
                r.setSoloTransporte(soloTransporte != null && soloTransporte);
                reciboEmpresaRepository.save(r);
            }
        }
    }

    public List<ReciboEmpresa> heredarDeQuincenaAnterior(Long quincenaId) {
        Quincena quincena = quincenaRepository.findById(quincenaId)
                .orElseThrow(() -> new RuntimeException("Quincena no encontrada"));

        Quincena anterior = quincenaRepository.findAll().stream()
                .filter(q -> !q.getId().equals(quincenaId) &&
                             q.getFechaFin().isBefore(quincena.getFechaInicio()))
                .max(Comparator.comparing(Quincena::getFechaFin))
                .orElse(null);

        if (anterior == null) return new ArrayList<>();

        List<ReciboEmpresa> recibosAnteriores = reciboEmpresaRepository.findByQuincenaId(anterior.getId());
        List<ReciboEmpresa> existentesNueva   = reciboEmpresaRepository.findByQuincenaId(quincenaId);

        // Empresas distintas de la quincena anterior (última config conocida)
        Map<String, ReciboEmpresa> empresasMap = new LinkedHashMap<>();
        for (ReciboEmpresa r : recibosAnteriores) {
            if (r.getNombreRecibo() != null)
                empresasMap.put(r.getNombreRecibo().trim().toLowerCase(), r);
        }

        // Empresas que ya tienen al menos un recibo en la nueva quincena
        Set<String> yaExisten = existentesNueva.stream()
                .filter(r -> r.getNombreRecibo() != null)
                .map(r -> r.getNombreRecibo().trim().toLowerCase())
                .collect(Collectors.toSet());

        LocalDate primerDia = quincena.getFechaInicio();
        List<ReciboEmpresa> creados = new ArrayList<>();
        for (ReciboEmpresa ref : empresasMap.values()) {
            if (!yaExisten.contains(ref.getNombreRecibo().trim().toLowerCase())) {
                ReciboEmpresa nuevo = new ReciboEmpresa();
                nuevo.setQuincena(quincena);
                nuevo.setNombreRecibo(ref.getNombreRecibo().trim());
                nuevo.setPrecioLitro(ref.getPrecioLitro());
                nuevo.setPrecioTransporte(ref.getPrecioTransporte());
                nuevo.setSoloTransporte(ref.getSoloTransporte());
                nuevo.setRuta(ref.getRuta());
                nuevo.setFecha(primerDia);
                nuevo.setLitrosRecibidos(0.0);
                creados.add(reciboEmpresaRepository.save(nuevo));
            }
        }
        return creados;
    }

    public TransporteResumenDTO resumenTransporte(Long quincenaId) {
        Quincena quincena = quincenaRepository.findById(quincenaId)
                .orElseThrow(() -> new RuntimeException("Quincena no encontrada: " + quincenaId));

        List<ReciboEmpresa> recibos = reciboEmpresaRepository.findByQuincenaId(quincenaId);
        List<Recoleccion> recolecciones = recoleccionRepository.findByQuincenaId(quincenaId);

        // Litros recogidos de proveedores agrupados por fecha
        Map<LocalDate, Double> recogidosPorDia = recolecciones.stream()
                .collect(Collectors.groupingBy(Recoleccion::getFecha,
                        Collectors.summingDouble(Recoleccion::getLitrosRecolectados)));

        // Recibos de empresa agrupados por fecha
        Map<LocalDate, List<ReciboEmpresa>> recibosPorDia = recibos.stream()
                .collect(Collectors.groupingBy(ReciboEmpresa::getFecha));

        // Nombres de empresas distintas (normalizados: trim + case-insensitive → un nombre canónico)
        Map<String, String> nombreCanonicoMap = new java.util.LinkedHashMap<>();
        recibos.stream()
                .filter(r -> r.getNombreRecibo() != null)
                .forEach(r -> {
                    String key = r.getNombreRecibo().trim().toLowerCase();
                    nombreCanonicoMap.putIfAbsent(key, r.getNombreRecibo().trim());
                });
        List<String> nombresEmpresas = nombreCanonicoMap.values().stream()
                .sorted(Comparator.nullsLast(Comparator.naturalOrder()))
                .collect(Collectors.toList());

        // Construir tabla día a día desde fechaInicio hasta fechaFin
        List<TransporteDiarioDTO> dias = new ArrayList<>();
        LocalDate fecha = quincena.getFechaInicio();
        while (!fecha.isAfter(quincena.getFechaFin())) {
            double litrosRecogidos = recogidosPorDia.getOrDefault(fecha, 0.0);
            List<ReciboEmpresa> recibosDia = recibosPorDia.getOrDefault(fecha, Collections.emptyList());

            // Agrupar recibos del día por empresa (case-insensitive) para evitar duplicados
            Map<String, List<ReciboEmpresa>> porEmpresaDia = recibosDia.stream()
                    .filter(r -> r.getNombreRecibo() != null)
                    .collect(Collectors.groupingBy(r -> r.getNombreRecibo().trim().toLowerCase()));

            List<EntregaDiariaEmpresaDTO> empresasDia = porEmpresaDia.entrySet().stream()
                    .map(e -> {
                        List<ReciboEmpresa> grupo = e.getValue();
                        ReciboEmpresa primero = grupo.get(0);
                        double litrosGrupo = grupo.stream()
                                .mapToDouble(r -> r.getLitrosRecibidos() != null ? r.getLitrosRecibidos() : 0).sum();
                        EntregaDiariaEmpresaDTO dto = new EntregaDiariaEmpresaDTO();
                        dto.setNombre(primero.getNombreRecibo().trim());
                        double pl = primero.getPrecioLitro() != null ? primero.getPrecioLitro() : 0;
                        double pt = primero.getPrecioTransporte() != null ? primero.getPrecioTransporte() : 0;
                        dto.setLitros(litrosGrupo);
                        dto.setPrecioLitro(pl);
                        dto.setPrecioTransporte(pt);
                        dto.setValorTotal(litrosGrupo * pl);
                        dto.setValorTransporte(litrosGrupo * pt);
                        dto.setValorProveedor(litrosGrupo * (pl - pt));
                        return dto;
                    })
                    .sorted(Comparator.comparing(EntregaDiariaEmpresaDTO::getNombre,
                            Comparator.nullsLast(Comparator.naturalOrder())))
                    .collect(Collectors.toList());

            // Solo suman al rinde los recibos donde la empresa paga completo (no solo transporte)
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

        double totalValorTransporte = recibos.stream().mapToDouble(r -> {
            double pt = r.getPrecioTransporte() != null ? r.getPrecioTransporte() : 0;
            return (r.getLitrosRecibidos() != null ? r.getLitrosRecibidos() : 0) * pt;
        }).sum();

        double totalValorProveedor = recibos.stream().mapToDouble(r -> {
            double pl = r.getPrecioLitro() != null ? r.getPrecioLitro() : 0;
            double pt = r.getPrecioTransporte() != null ? r.getPrecioTransporte() : 0;
            return (r.getLitrosRecibidos() != null ? r.getLitrosRecibidos() : 0) * (pl - pt);
        }).sum();

        TransporteResumenDTO resumen = new TransporteResumenDTO();
        resumen.setQuincenaId(quincenaId);
        resumen.setTextoQuincena(quincena.getTextoQuincena());
        resumen.setFechaInicio(quincena.getFechaInicio().toString());
        resumen.setFechaFin(quincena.getFechaFin().toString());
        resumen.setEmpresas(nombresEmpresas);
        resumen.setDias(dias);
        resumen.setTotalLitrosRecogidos(totalRecogidos);
        resumen.setTotalLitrosEntregados(totalEntregados);
        resumen.setTotalRinde(totalEntregados - totalRecogidos);
        resumen.setTotalValorTransporte(totalValorTransporte);
        resumen.setTotalValorProveedor(totalValorProveedor);
        return resumen;
    }

}
