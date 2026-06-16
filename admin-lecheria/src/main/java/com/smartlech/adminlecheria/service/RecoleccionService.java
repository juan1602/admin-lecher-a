package com.smartlech.adminlecheria.service;

import com.smartlech.adminlecheria.dto.DescuentoDetalleDTO;
import com.smartlech.adminlecheria.dto.RecoleccionDiariaDTO;
import com.smartlech.adminlecheria.dto.ResumenProveedorDTO;
import com.smartlech.adminlecheria.dto.ResumenQuincenaDTO;
import com.smartlech.adminlecheria.entity.Descuento;
import com.smartlech.adminlecheria.entity.Proveedor;
import com.smartlech.adminlecheria.entity.Quincena;
import com.smartlech.adminlecheria.entity.Recoleccion;
import com.smartlech.adminlecheria.repository.DescuentoRepository;
import com.smartlech.adminlecheria.repository.QuincenaRepository;
import com.smartlech.adminlecheria.repository.RecoleccionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Collator;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecoleccionService {

    private final RecoleccionRepository recoleccionRepository;
    private final DescuentoRepository descuentoRepository;
    private final QuincenaRepository quincenaRepository;

    public List<Recoleccion> listarPorQuincena(Long quincenaId) {
        return recoleccionRepository.findByQuincenaId(quincenaId);
    }

    public List<Recoleccion> listarPorProveedorYQuincena(Long proveedorId, Long quincenaId) {
        return recoleccionRepository.findByProveedorIdAndQuincenaId(proveedorId, quincenaId);
    }

    public List<Recoleccion> listarPendientesSincronizacion() {
        return recoleccionRepository.findBySincronizadoFalse();
    }

    public Recoleccion guardar(Recoleccion recoleccion) {
        if (recoleccion.getId() == null) {
            boolean yaExiste = recoleccionRepository
                .findByProveedorIdAndQuincenaId(
                    recoleccion.getProveedor().getId(),
                    recoleccion.getQuincena().getId()
                )
                .stream()
                .anyMatch(r -> r.getFecha().equals(recoleccion.getFecha()));

            if (yaExiste) {
                throw new RuntimeException("Ya existe una recolección para este proveedor en esta fecha");
            }
        }

        if (recoleccion.getFechaRegistro() == null) {
            recoleccion.setFechaRegistro(LocalDateTime.now());
        }
        return recoleccionRepository.save(recoleccion);
    }

    public List<Recoleccion> sincronizar(List<Recoleccion> recolecciones) {
        recolecciones.forEach(r -> {
            r.setSincronizado(true);
            if (r.getFechaRegistro() == null) {
                r.setFechaRegistro(LocalDateTime.now());
            }
        });
        return recoleccionRepository.saveAll(recolecciones);
    }

    public ResumenQuincenaDTO resumenPorQuincena(Long quincenaId) {
        Quincena quincena = quincenaRepository.findById(quincenaId)
            .orElseThrow(() -> new RuntimeException("Quincena no encontrada: " + quincenaId));

        List<Recoleccion> recolecciones = recoleccionRepository.findByQuincenaId(quincenaId);
        List<Descuento> todosDescuentos = descuentoRepository.findByQuincenaId(quincenaId);

        Map<Long, List<Recoleccion>> porProveedor = recolecciones.stream()
            .collect(Collectors.groupingBy(r -> r.getProveedor().getId()));

        List<ResumenProveedorDTO> proveedores = porProveedor.entrySet().stream()
            .map(entry -> calcularResumenProveedor(entry.getKey(), entry.getValue(), todosDescuentos))
            .sorted(Comparator.comparing(ResumenProveedorDTO::getNombre,
                    Comparator.nullsLast(Comparator.naturalOrder())))
            .collect(Collectors.toList());

        ResumenQuincenaDTO resumen = new ResumenQuincenaDTO();
        resumen.setQuincenaId(quincenaId);
        resumen.setTextoQuincena(quincena.getTextoQuincena());
        resumen.setFechaInicio(quincena.getFechaInicio().toString());
        resumen.setFechaFin(quincena.getFechaFin().toString());
        resumen.setTotalProveedores(proveedores.size());
        resumen.setTotalLitros(proveedores.stream().mapToDouble(ResumenProveedorDTO::getTotalLitros).sum());
        resumen.setTotalValorBruto(proveedores.stream().mapToDouble(ResumenProveedorDTO::getValorBruto).sum());
        resumen.setTotalDescuentos4x1000(proveedores.stream().mapToDouble(ResumenProveedorDTO::getDescuento4x1000).sum());
        resumen.setTotalOtrosDescuentos(proveedores.stream().mapToDouble(ResumenProveedorDTO::getTotalOtrosDescuentos).sum());
        resumen.setTotalValorNeto(proveedores.stream().mapToDouble(ResumenProveedorDTO::getValorNeto).sum());
        resumen.setProveedores(proveedores);

        return resumen;
    }

    private ResumenProveedorDTO calcularResumenProveedor(Long proveedorId, List<Recoleccion> recolecciones, List<Descuento> todosDescuentos) {
        Proveedor prov = recolecciones.get(0).getProveedor();

        List<Recoleccion> ordenadas = recolecciones.stream()
            .sorted(Comparator.comparing(Recoleccion::getFecha))
            .collect(Collectors.toList());

        double totalLitros = ordenadas.stream().mapToDouble(Recoleccion::getLitrosRecolectados).sum();
        double precioLitro = prov.getPrecioLitro() != null ? prov.getPrecioLitro() : 0;
        double valorBruto = totalLitros * precioLitro;
        double descuento4x1000 = (prov.getAplica4x1000())
            ? Math.round(valorBruto * 4.0 / 1000.0 * 100.0) / 100.0
            : 0.0;

        List<Descuento> descsProv = todosDescuentos.stream()
            .filter(d -> d.getProveedor().getId().equals(proveedorId))
            .collect(Collectors.toList());

        List<DescuentoDetalleDTO> otrosDesc = descsProv.stream()
            .map(d -> new DescuentoDetalleDTO(d.getId(), d.getConcepto(), d.getValor()))
            .collect(Collectors.toList());

        double totalOtrosDescuentos = descsProv.stream().mapToDouble(Descuento::getValor).sum();
        double valorNeto = valorBruto - descuento4x1000 - totalOtrosDescuentos;

        List<RecoleccionDiariaDTO> diarias = ordenadas.stream()
            .map(r -> new RecoleccionDiariaDTO(r.getFecha().toString(), r.getLitrosRecolectados(), r.getVale()))
            .collect(Collectors.toList());

        Collator collator = Collator.getInstance(new Locale("es", "CO"));
        collator.setStrength(Collator.PRIMARY);
        Long provRutaId = prov.getRuta() != null ? prov.getRuta().getId() : null;
        TreeSet<String> conductoresSet = new TreeSet<>(collator);
        ordenadas.forEach(r -> {
            var c = r.getConductor();
            boolean sirveRuta = provRutaId == null || c.getRutaIds().isEmpty() || c.getRutaIds().contains(provRutaId);
            if (sirveRuta) conductoresSet.add(c.getNombre().trim());
        });
        String conductores = String.join(" Y ", conductoresSet);

        ResumenProveedorDTO dto = new ResumenProveedorDTO();
        dto.setProveedorId(proveedorId);
        dto.setRutaId(prov.getRuta() != null ? prov.getRuta().getId() : null);
        dto.setRutaNombre(prov.getRuta() != null ? prov.getRuta().getNombre() : null);
        dto.setNombre(prov.getNombre());
        dto.setZona(prov.getZona());
        dto.setTipoLeche(prov.getTipoLeche());
        dto.setConductores(conductores);
        dto.setDiasRecolectados(ordenadas.size());
        dto.setTotalLitros(totalLitros);
        dto.setPrecioLitro(precioLitro);
        dto.setValorBruto(valorBruto);
        dto.setCuotaLitros(prov.getCuotaLitros() != null ? prov.getCuotaLitros() : 0);
        dto.setDescuento4x1000(descuento4x1000);
        dto.setOtrosDescuentos(otrosDesc);
        dto.setTotalOtrosDescuentos(totalOtrosDescuentos);
        dto.setValorNeto(valorNeto);
        dto.setRecolecciones(diarias);
        return dto;
    }
}
