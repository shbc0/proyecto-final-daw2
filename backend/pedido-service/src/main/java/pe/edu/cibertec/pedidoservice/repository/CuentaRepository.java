package pe.edu.cibertec.pedidoservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.cibertec.pedidoservice.model.Cuenta;
import pe.edu.cibertec.pedidoservice.model.EstadoCuenta;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CuentaRepository extends JpaRepository<Cuenta, Integer> {
    Optional<Cuenta> findFirstByIdmesaAndEstado(Integer idmesa, EstadoCuenta estado);

    List<Cuenta> findByEstadoAndFechaCierreGreaterThanEqualAndFechaCierreLessThan(
            EstadoCuenta estado, LocalDateTime desde, LocalDateTime hasta);
}
