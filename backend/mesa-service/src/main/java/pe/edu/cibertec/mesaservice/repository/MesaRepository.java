package pe.edu.cibertec.mesaservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.cibertec.mesaservice.model.EstadoMesa;
import pe.edu.cibertec.mesaservice.model.Mesa;

import java.util.List;

public interface MesaRepository extends JpaRepository<Mesa, Integer> {
    List<Mesa> findAllByOrderByNumeroAsc();
    List<Mesa> findByEstadoOrderByNumeroAsc(EstadoMesa estado);
    boolean existsByNumero(Integer numero);
    boolean existsByNumeroAndIdmesaNot(Integer numero, Integer idmesa);
}
