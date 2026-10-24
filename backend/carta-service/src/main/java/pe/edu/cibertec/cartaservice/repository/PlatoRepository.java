package pe.edu.cibertec.cartaservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.cibertec.cartaservice.model.Plato;

import java.util.List;

public interface PlatoRepository extends JpaRepository<Plato, Integer> {
    List<Plato> findByDisponibleTrue();
}
