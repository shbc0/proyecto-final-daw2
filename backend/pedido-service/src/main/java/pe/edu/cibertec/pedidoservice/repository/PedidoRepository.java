package pe.edu.cibertec.pedidoservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.edu.cibertec.pedidoservice.model.Cuenta;
import pe.edu.cibertec.pedidoservice.model.EstadoPedido;
import pe.edu.cibertec.pedidoservice.model.Pedido;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Integer> {

    @Query("select p from Pedido p " +
           "where (:idmesa is null or p.idmesa = :idmesa) " +
           "and p.estado in :estados " +
           "order by p.fechaRegistro asc")
    List<Pedido> buscar(@Param("idmesa") Integer idmesa,
                        @Param("estados") Collection<EstadoPedido> estados);

    List<Pedido> findByCuentaOrderByFechaRegistroAsc(Cuenta cuenta);

    boolean existsByCuentaAndEstadoNot(Cuenta cuenta, EstadoPedido estado);

    long countByIdmesaAndEstadoIn(Integer idmesa, Collection<EstadoPedido> estados);

    List<Pedido> findByFechaRegistroGreaterThanEqualAndFechaRegistroLessThan(LocalDateTime desde, LocalDateTime hasta);
}
