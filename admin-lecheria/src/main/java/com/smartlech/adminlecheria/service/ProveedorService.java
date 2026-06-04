package com.smartlech.adminlecheria.service;

import com.smartlech.adminlecheria.entity.Proveedor;
import com.smartlech.adminlecheria.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProveedorService {

    private final ProveedorRepository proveedorRepository;

    public List<Proveedor> listarActivos() {
        return proveedorRepository.findByActivoTrue();
    }

    public List<Proveedor> listarTodos() {
        return proveedorRepository.findAll();
    }

    public Proveedor guardar(Proveedor proveedor) {
        return proveedorRepository.save(proveedor);
    }

    public Proveedor buscarPorId(Long id) {
        return proveedorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado: " + id));
    }

    public Proveedor actualizar(Long id, Proveedor datos) {
        Proveedor proveedor = buscarPorId(id);
        proveedor.setNombre(datos.getNombre());
        proveedor.setZona(datos.getZona());
        proveedor.setPrecioLitro(datos.getPrecioLitro());
        proveedor.setCuotaLitros(datos.getCuotaLitros());
        proveedor.setTipoLeche(datos.getTipoLeche());
        return proveedorRepository.save(proveedor);
    }

    public void desactivar(Long id) {
        Proveedor proveedor = buscarPorId(id);
        proveedor.setActivo(false);
        proveedorRepository.save(proveedor);
    }
}