package com.smartlech.adminlecheria.service;

import com.smartlech.adminlecheria.entity.ExcedenteProveedor;
import com.smartlech.adminlecheria.entity.Proveedor;
import com.smartlech.adminlecheria.entity.Quincena;
import com.smartlech.adminlecheria.repository.ExcedenteProveedorRepository;
import com.smartlech.adminlecheria.repository.ProveedorRepository;
import com.smartlech.adminlecheria.repository.QuincenaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExcedenteProveedorService {

    private final ExcedenteProveedorRepository excedenteRepository;
    private final QuincenaRepository quincenaRepository;
    private final ProveedorRepository proveedorRepository;

    public List<ExcedenteProveedor> listarPorQuincena(Long quincenaId) {
        return excedenteRepository.findByQuincenaId(quincenaId);
    }

    public ExcedenteProveedor guardarOActualizar(Long quincenaId, Long proveedorId, Double valorPorLitro) {
        ExcedenteProveedor exc = excedenteRepository
            .findByQuincenaIdAndProveedorId(quincenaId, proveedorId)
            .orElseGet(ExcedenteProveedor::new);

        Quincena quincena = quincenaRepository.findById(quincenaId)
            .orElseThrow(() -> new RuntimeException("Quincena no encontrada: " + quincenaId));
        Proveedor proveedor = proveedorRepository.findById(proveedorId)
            .orElseThrow(() -> new RuntimeException("Proveedor no encontrado: " + proveedorId));

        exc.setQuincena(quincena);
        exc.setProveedor(proveedor);
        exc.setValorPorLitro(valorPorLitro);
        return excedenteRepository.save(exc);
    }

    public void eliminarPorQuincenaYProveedor(Long quincenaId, Long proveedorId) {
        excedenteRepository.findByQuincenaIdAndProveedorId(quincenaId, proveedorId)
            .ifPresent(excedenteRepository::delete);
    }

    // Copia los excedentes de la quincena anterior para los proveedores que aún no tienen valor en la actual
    public void heredarDeQuincenaAnterior(Long quincenaId) {
        Quincena actual = quincenaRepository.findById(quincenaId)
            .orElseThrow(() -> new RuntimeException("Quincena no encontrada: " + quincenaId));

        Quincena anterior = quincenaRepository.findAll().stream()
            .filter(q -> !q.getId().equals(quincenaId) && q.getFechaFin().isBefore(actual.getFechaInicio()))
            .max(Comparator.comparing(Quincena::getFechaFin))
            .orElse(null);

        if (anterior == null) return;

        List<ExcedenteProveedor> excAnteriores = excedenteRepository.findByQuincenaId(anterior.getId());
        if (excAnteriores.isEmpty()) return;

        Set<Long> yaExisten = excedenteRepository.findByQuincenaId(quincenaId).stream()
            .map(e -> e.getProveedor().getId())
            .collect(Collectors.toSet());

        for (ExcedenteProveedor exc : excAnteriores) {
            if (!yaExisten.contains(exc.getProveedor().getId())) {
                ExcedenteProveedor nuevo = new ExcedenteProveedor();
                nuevo.setQuincena(actual);
                nuevo.setProveedor(exc.getProveedor());
                nuevo.setValorPorLitro(exc.getValorPorLitro());
                excedenteRepository.save(nuevo);
            }
        }
    }
}
