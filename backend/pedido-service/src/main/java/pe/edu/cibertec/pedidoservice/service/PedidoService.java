package pe.edu.cibertec.pedidoservice.service;

import feign.FeignException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.cibertec.pedidoservice.dto.*;
import pe.edu.cibertec.pedidoservice.model.Cuenta;
import pe.edu.cibertec.pedidoservice.model.DetallePedido;
import pe.edu.cibertec.pedidoservice.model.EstadoCuenta;
import pe.edu.cibertec.pedidoservice.model.EstadoPedido;
import pe.edu.cibertec.pedidoservice.model.Pedido;
import pe.edu.cibertec.pedidoservice.remoteservice.CartaClient;
import pe.edu.cibertec.pedidoservice.remoteservice.model.DisponibilidadRemota;
import pe.edu.cibertec.pedidoservice.remoteservice.model.MesaRemota;
import pe.edu.cibertec.pedidoservice.remoteservice.model.PlatoRemoto;
import pe.edu.cibertec.pedidoservice.repository.CuentaRepository;
import pe.edu.cibertec.pedidoservice.repository.PedidoRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.NoSuchElementException;

import static pe.edu.cibertec.pedidoservice.model.EstadoPedido.*;

@RequiredArgsConstructor
@Service
public class PedidoService {

    static final List<EstadoPedido> ACTIVOS = List.of(PENDIENTE, EN_PREPARACION, LISTO);

    private final PedidoRepository pedidoRepository;
    private final CuentaRepository cuentaRepository;
    private final CartaClient cartaClient;
    private final MesaRemotaService mesaRemotaService;

    @Transactional(readOnly = true)
    public List<PedidoResponse> listar(List<EstadoPedido> estados, Integer idmesa) {
        Collection<EstadoPedido> filtro =
                (estados == null || estados.isEmpty()) ? List.of(EstadoPedido.values()) : estados;
        return pedidoRepository.buscar(idmesa, filtro).stream().map(this::aResponse).toList();
    }

    @Transactional(readOnly = true)
    public PedidoResponse obtener(Integer id) {
        return aResponse(buscar(id));
    }

    @Transactional
    public PedidoResponse crear(PedidoRequest req, Authentication auth) {
        if (req == null || req.getIdmesa() == null) {
            throw new IllegalArgumentException("Indica la mesa del pedido.");
        }
        MesaRemota mesa = mesaRemotaService.obtener(req.getIdmesa());
        if (!"OCUPADA".equals(mesa.getEstado())) {
            throw new IllegalArgumentException(
                    "La mesa " + mesa.getNumero() + " está libre: ocúpala antes de registrar el pedido.");
        }
        Cuenta cuenta = cuentaRepository.findFirstByIdmesaAndEstado(mesa.getIdmesa(), EstadoCuenta.ABIERTA)
                .orElse(null);
        boolean adicional = cuenta != null && pedidoRepository.existsByCuentaAndEstadoNot(cuenta, ANULADO);
        if (cuenta == null) {
            cuenta = abrirCuenta(mesa);
        }

        Pedido p = new Pedido();
        p.setIdmesa(mesa.getIdmesa());
        p.setNumeroMesa(mesa.getNumero());
        p.setCuenta(cuenta);
        p.setAdicional(adicional);
        p.setMozo(auth.getName());
        p.setEstado(PENDIENTE);
        p.setFechaRegistro(LocalDateTime.now());
        agregarDetalles(p, req.getDetalles());
        return aResponse(pedidoRepository.save(p));
    }

    @Transactional
    public PedidoResponse actualizar(Integer id, PedidoRequest req) {
        Pedido p = buscar(id);
        if (p.getEstado() != PENDIENTE) {
            throw new IllegalArgumentException(
                    "Solo se puede modificar un pedido pendiente. Para agregar platos registra un pedido adicional.");
        }
        List<DetalleRequest> nuevos = (req == null) ? null : req.getDetalles();
        p.getDetalles().clear();
        agregarDetalles(p, nuevos);
        return aResponse(pedidoRepository.save(p));
    }

    @Transactional
    public PedidoResponse cambiarEstado(Integer id, EstadoPedido nuevo, Authentication auth) {
        if (nuevo == null) {
            throw new IllegalArgumentException("Indica el nuevo estado del pedido.");
        }
        Pedido p = buscar(id);
        EstadoPedido actual = p.getEstado();
        LocalDateTime ahora = LocalDateTime.now();

        if (actual == PENDIENTE && nuevo == EN_PREPARACION) {
            exigirRol(auth, "Solo la cocina puede cambiar ese estado.", "COCINA");
            if (p.getDetalles().stream().anyMatch(DetallePedido::isAgotado)) {
                throw new IllegalArgumentException(
                        "El pedido tiene un plato agotado: espera a que el mozo lo cambie o anule el pedido.");
            }
            p.setFechaPreparacion(ahora);
        } else if (actual == EN_PREPARACION && nuevo == LISTO) {
            exigirRol(auth, "Solo la cocina puede cambiar ese estado.", "COCINA");
            p.setFechaListo(ahora);
        } else if (nuevo == ENTREGADO) {
            if (actual != LISTO) {
                throw new IllegalArgumentException("Solo se puede entregar un pedido que la cocina marcó como listo.");
            }
            exigirRol(auth, "Solo un mozo puede entregar el pedido.", "MOZO");
            p.setFechaEntrega(ahora);
            p.setMozoEntrega(auth.getName());
        } else if (nuevo == ANULADO) {
            if (actual != PENDIENTE) {
                throw new IllegalArgumentException("Solo se puede anular un pedido pendiente.");
            }
            exigirRol(auth, "Solo un mozo puede anular el pedido.", "MOZO");
            p.setFechaAnulacion(ahora);
        } else {
            throw new IllegalArgumentException("No se puede pasar un pedido de " + actual + " a " + nuevo + ".");
        }
        p.setEstado(nuevo);
        return aResponse(pedidoRepository.save(p));
    }

    @Transactional
    public PedidoResponse marcarAgotado(Integer id, Integer iddetalle) {
        Pedido p = buscar(id);
        if (p.getEstado() != PENDIENTE) {
            throw new IllegalArgumentException("Solo se puede marcar un plato agotado en un pedido pendiente.");
        }
        DetallePedido d = p.getDetalles().stream()
                .filter(x -> x.getIddetalle().equals(iddetalle))
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException("El plato no pertenece a este pedido."));
        if (d.isAgotado()) {
            throw new IllegalArgumentException("Ese plato ya está marcado como agotado.");
        }
        d.setAgotado(true);
        p.setPlatosAgotados(p.getPlatosAgotados() + 1);
        try {
            cartaClient.cambiarDisponibilidad(d.getIdplato(), new DisponibilidadRemota(false));
        } catch (RuntimeException e) {
            throw new ServicioNoDisponibleException("No se pudo actualizar la carta (carta-service).");
        }
        return aResponse(pedidoRepository.save(p));
    }

    @Transactional
    public void eliminar(Integer id) {
        Pedido p = buscar(id);
        if (p.getEstado() != ANULADO) {
            throw new IllegalArgumentException("Solo se pueden eliminar pedidos anulados.");
        }
        pedidoRepository.delete(p);
    }

    PedidoResponse aResponse(Pedido p) {
        List<DetalleResponse> detalles = p.getDetalles().stream()
                .map(d -> DetalleResponse.builder()
                        .iddetalle(d.getIddetalle())
                        .idplato(d.getIdplato())
                        .nombrePlato(d.getNombrePlato())
                        .precioUnitario(d.getPrecioUnitario())
                        .cantidad(d.getCantidad())
                        .observacion(d.getObservacion())
                        .subtotal(d.getPrecioUnitario().multiply(BigDecimal.valueOf(d.getCantidad())))
                        .agotado(d.isAgotado())
                        .build())
                .toList();
        BigDecimal total = detalles.stream()
                .filter(d -> !d.isAgotado())
                .map(DetalleResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return PedidoResponse.builder()
                .idpedido(p.getIdpedido())
                .idmesa(p.getIdmesa())
                .numeroMesa(p.getNumeroMesa())
                .idcuenta(p.getCuenta() == null ? null : p.getCuenta().getIdcuenta())
                .adicional(p.isAdicional())
                .mozo(p.getMozo())
                .mozoEntrega(p.getMozoEntrega())
                .estado(p.getEstado())
                .fechaRegistro(p.getFechaRegistro())
                .fechaPreparacion(p.getFechaPreparacion())
                .fechaListo(p.getFechaListo())
                .fechaEntrega(p.getFechaEntrega())
                .fechaAnulacion(p.getFechaAnulacion())
                .total(total)
                .detalles(detalles)
                .build();
    }

    private Pedido buscar(Integer id) {
        return pedidoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("El pedido no existe."));
    }

    private Cuenta abrirCuenta(MesaRemota mesa) {
        Cuenta c = new Cuenta();
        c.setIdmesa(mesa.getIdmesa());
        c.setNumeroMesa(mesa.getNumero());
        c.setComensales(mesa.getComensales());
        c.setEstado(EstadoCuenta.ABIERTA);
        c.setFechaApertura(LocalDateTime.now());
        return cuentaRepository.save(c);
    }

    private void agregarDetalles(Pedido p, List<DetalleRequest> lista) {
        if (lista == null || lista.isEmpty()) {
            throw new IllegalArgumentException("El pedido debe tener al menos un plato.");
        }
        for (DetalleRequest dr : lista) {
            if (dr.getIdplato() == null) {
                throw new IllegalArgumentException("Cada detalle debe indicar el plato.");
            }
            if (dr.getCantidad() == null || dr.getCantidad() < 1) {
                throw new IllegalArgumentException("La cantidad de cada plato debe ser al menos 1.");
            }
            PlatoRemoto plato = consultarPlato(dr.getIdplato());
            if (!Boolean.TRUE.equals(plato.getDisponible())) {
                throw new IllegalArgumentException("El plato '" + plato.getNombre() + "' está agotado.");
            }
            DetallePedido d = new DetallePedido();
            d.setPedido(p);
            d.setIdplato(plato.getIdplato());
            d.setNombrePlato(plato.getNombre());
            d.setPrecioUnitario(plato.getPrecio());
            d.setCantidad(dr.getCantidad());
            d.setObservacion(dr.getObservacion() == null || dr.getObservacion().isBlank()
                    ? null : dr.getObservacion().trim());
            p.getDetalles().add(d);
        }
    }

    private PlatoRemoto consultarPlato(Integer id) {
        try {
            return cartaClient.obtenerPlato(id);
        } catch (FeignException.NotFound e) {
            throw new IllegalArgumentException("El plato con id " + id + " no existe.");
        } catch (RuntimeException e) {
            throw new ServicioNoDisponibleException("No se pudo consultar la carta (carta-service).");
        }
    }

    private void exigirRol(Authentication auth, String mensaje, String rol) {
        boolean permitido = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + rol) || a.getAuthority().equals("ROLE_ADMIN"));
        if (!permitido) {
            throw new AccessDeniedException(mensaje);
        }
    }
}
