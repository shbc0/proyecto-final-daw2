package pe.edu.cibertec.cartaservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.cibertec.cartaservice.model.Plato;
import pe.edu.cibertec.cartaservice.repository.PlatoRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.NoSuchElementException;

@RequiredArgsConstructor
@Service
public class PlatoService {

    private final PlatoRepository platoRepository;

    @Transactional(readOnly = true)
    public List<Plato> listar(boolean soloDisponibles) {
        return soloDisponibles ? platoRepository.findByDisponibleTrue() : platoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Plato obtener(Integer id) {
        return platoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("El plato no existe."));
    }

    @Transactional
    public Plato crear(Plato plato) {
        validar(plato);
        plato.setIdplato(null);
        return platoRepository.save(plato);
    }

    @Transactional
    public Plato actualizar(Integer id, Plato datos) {
        validar(datos);
        Plato p = obtener(id);
        p.setNombre(datos.getNombre().trim());
        p.setDescripcion(datos.getDescripcion());
        p.setPrecio(datos.getPrecio());
        p.setCategoria(datos.getCategoria());
        p.setDisponible(datos.getDisponible());
        return platoRepository.save(p);
    }

    @Transactional
    public Plato cambiarDisponibilidad(Integer id, Boolean disponible) {
        if (disponible == null) {
            throw new IllegalArgumentException("Indica si el plato está disponible (true o false).");
        }
        Plato p = obtener(id);
        p.setDisponible(disponible);
        return platoRepository.save(p);
    }

    @Transactional
    public void eliminar(Integer id) {
        platoRepository.delete(obtener(id));
    }

    private void validar(Plato p) {
        if (p.getNombre() == null || p.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre del plato es obligatorio.");
        }
        if (p.getPrecio() == null || p.getPrecio().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El precio debe ser mayor que cero.");
        }
        if (p.getDisponible() == null) {
            p.setDisponible(true);
        }
    }
}
