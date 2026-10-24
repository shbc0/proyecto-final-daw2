package pe.edu.cibertec.mesaservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.cibertec.mesaservice.model.EstadoMesa;
import pe.edu.cibertec.mesaservice.model.Mesa;
import pe.edu.cibertec.mesaservice.repository.MesaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@RequiredArgsConstructor
@Service
public class MesaService {

    private final MesaRepository mesaRepository;

    @Transactional(readOnly = true)
    public List<Mesa> listar(EstadoMesa estado) {
        return estado == null
                ? mesaRepository.findAllByOrderByNumeroAsc()
                : mesaRepository.findByEstadoOrderByNumeroAsc(estado);
    }

    @Transactional(readOnly = true)
    public Mesa obtener(Integer id) {
        return mesaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("La mesa no existe."));
    }

    @Transactional
    public Mesa crear(Mesa datos) {
        validar(datos);
        if (mesaRepository.existsByNumero(datos.getNumero())) {
            throw new IllegalArgumentException("Ya existe una mesa con el número " + datos.getNumero() + ".");
        }
        Mesa m = new Mesa();
        m.setNumero(datos.getNumero());
        m.setCapacidad(datos.getCapacidad());
        m.setEstado(EstadoMesa.LIBRE);
        return mesaRepository.save(m);
    }

    @Transactional
    public Mesa actualizar(Integer id, Mesa datos) {
        validar(datos);
        Mesa m = obtener(id);
        if (mesaRepository.existsByNumeroAndIdmesaNot(datos.getNumero(), id)) {
            throw new IllegalArgumentException("Ya existe una mesa con el número " + datos.getNumero() + ".");
        }
        if (m.getEstado() == EstadoMesa.OCUPADA) {
            if (!m.getNumero().equals(datos.getNumero())) {
                throw new IllegalArgumentException("No se puede cambiar el número de una mesa ocupada.");
            }
            if (m.getComensales() != null && datos.getCapacidad() < m.getComensales()) {
                throw new IllegalArgumentException(
                        "La mesa tiene " + m.getComensales() + " comensales: la capacidad no puede ser menor.");
            }
        }
        m.setNumero(datos.getNumero());
        m.setCapacidad(datos.getCapacidad());
        return mesaRepository.save(m);
    }

    @Transactional
    public Mesa ocupar(Integer id, Integer comensales) {
        Mesa m = obtener(id);
        if (m.getEstado() == EstadoMesa.OCUPADA) {
            throw new IllegalArgumentException("La mesa " + m.getNumero() + " ya está ocupada.");
        }
        if (comensales == null || comensales < 1) {
            throw new IllegalArgumentException("Indica cuántos comensales ocupan la mesa.");
        }
        if (comensales > m.getCapacidad()) {
            throw new IllegalArgumentException(
                    "La mesa " + m.getNumero() + " es para " + m.getCapacidad() + " personas como máximo.");
        }
        m.setEstado(EstadoMesa.OCUPADA);
        m.setComensales(comensales);
        m.setFechaOcupacion(LocalDateTime.now());
        return mesaRepository.save(m);
    }

    @Transactional
    public Mesa liberar(Integer id) {
        Mesa m = obtener(id);
        if (m.getEstado() == EstadoMesa.LIBRE) {
            throw new IllegalArgumentException("La mesa " + m.getNumero() + " ya está libre.");
        }
        m.setEstado(EstadoMesa.LIBRE);
        m.setComensales(null);
        m.setFechaOcupacion(null);
        return mesaRepository.save(m);
    }

    @Transactional
    public void eliminar(Integer id) {
        Mesa m = obtener(id);
        if (m.getEstado() == EstadoMesa.OCUPADA) {
            throw new IllegalArgumentException("No se puede eliminar una mesa ocupada.");
        }
        mesaRepository.delete(m);
    }

    private void validar(Mesa m) {
        if (m.getNumero() == null || m.getNumero() <= 0) {
            throw new IllegalArgumentException("El número de mesa debe ser mayor que cero.");
        }
        if (m.getCapacidad() == null || m.getCapacidad() <= 0) {
            throw new IllegalArgumentException("La capacidad debe ser mayor que cero.");
        }
    }
}
