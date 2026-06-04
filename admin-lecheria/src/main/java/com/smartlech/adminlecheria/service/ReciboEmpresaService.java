package com.smartlech.adminlecheria.service;

import com.smartlech.adminlecheria.dto.EntregaDiariaEmpresaDTO;
import com.smartlech.adminlecheria.dto.TransporteDiarioDTO;
import com.smartlech.adminlecheria.dto.TransporteResumenDTO;
import com.smartlech.adminlecheria.entity.Quincena;
import com.smartlech.adminlecheria.entity.Recoleccion;
import com.smartlech.adminlecheria.entity.ReciboEmpresa;
import com.smartlech.adminlecheria.repository.QuincenaRepository;
import com.smartlech.adminlecheria.repository.ReciboEmpresaRepository;
import com.smartlech.adminlecheria.repository.RecoleccionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
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
        return reciboEmpresaRepository.save(recibo);
    }

    public ReciboEmpresa buscarPorId(Long id) {
        return reciboEmpresaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recibo no encontrado: " + id));
    }

    public void eliminar(Long id) {
        reciboEmpresaRepository.deleteById(id);
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

        // Nombres de empresas distintas ordenados
        List<String> nombresEmpresas = recibos.stream()
                .map(ReciboEmpresa::getNombreRecibo)
                .distinct()
                .sorted(Comparator.nullsLast(Comparator.naturalOrder()))
                .collect(Collectors.toList());

        // Construir tabla día a día desde fechaInicio hasta fechaFin
        List<TransporteDiarioDTO> dias = new ArrayList<>();
        LocalDate fecha = quincena.getFechaInicio();
        while (!fecha.isAfter(quincena.getFechaFin())) {
            double litrosRecogidos = recogidosPorDia.getOrDefault(fecha, 0.0);
            List<ReciboEmpresa> recibosDia = recibosPorDia.getOrDefault(fecha, Collections.emptyList());

            List<EntregaDiariaEmpresaDTO> empresasDia = recibosDia.stream()
                    .map(this::buildEntregaDTO)
                    .sorted(Comparator.comparing(EntregaDiariaEmpresaDTO::getNombre,
                            Comparator.nullsLast(Comparator.naturalOrder())))
                    .collect(Collectors.toList());

            double litrosEntregados = empresasDia.stream()
                    .mapToDouble(EntregaDiariaEmpresaDTO::getLitros).sum();

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

    private EntregaDiariaEmpresaDTO buildEntregaDTO(ReciboEmpresa r) {
        EntregaDiariaEmpresaDTO dto = new EntregaDiariaEmpresaDTO();
        dto.setNombre(r.getNombreRecibo());
        double litros = r.getLitrosRecibidos() != null ? r.getLitrosRecibidos() : 0;
        double precioLitro = r.getPrecioLitro() != null ? r.getPrecioLitro() : 0;
        double precioTrans = r.getPrecioTransporte() != null ? r.getPrecioTransporte() : 0;
        dto.setLitros(litros);
        dto.setPrecioLitro(precioLitro);
        dto.setPrecioTransporte(precioTrans);
        dto.setValorTotal(litros * precioLitro);
        dto.setValorTransporte(litros * precioTrans);
        dto.setValorProveedor(litros * (precioLitro - precioTrans));
        return dto;
    }
}
