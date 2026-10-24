package pe.edu.cibertec.pedidoservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.cibertec.pedidoservice.dto.CuentaItemResponse;
import pe.edu.cibertec.pedidoservice.dto.CuentaResponse;
import pe.edu.cibertec.pedidoservice.dto.PedidoResponse;
import pe.edu.cibertec.pedidoservice.model.Cuenta;
import pe.edu.cibertec.pedidoservice.model.DetallePedido;
import pe.edu.cibertec.pedidoservice.model.EstadoCuenta;
import pe.edu.cibertec.pedidoservice.model.Pedido;
import pe.edu.cibertec.pedidoservice.remoteservice.model.MesaRemota;
import pe.edu.cibertec.pedidoservice.repository.CuentaRepository;
import pe.edu.cibertec.pedidoservice.repository.PedidoRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import static pe.edu.cibertec.pedidoservice.model.EstadoPedido.ANULADO;

@RequiredArgsConstructor
@Service
public class CuentaService {

    private final CuentaRepository cuentaRepository;
    private final PedidoRepository pedidoRepository;
    private final PedidoService pedidoService;
    private final MesaRemotaService mesaRemotaService;

    @Transactional(readOnly = true)
    public CuentaResponse obtenerAbiertaDeMesa(Integer idmesa) {
        Cuenta c = cuentaRepository.findFirstByIdmesaAndEstado(idmesa, EstadoCuenta.ABIERTA)
                .orElseThrow(() -> new NoSuchElementException("La mesa no tiene consumos registrados."));
        return aResponse(c);
    }

    @Transactional(readOnly = true)
    public CuentaResponse obtener(Integer id) {
        return aResponse(buscar(id));
    }

    @Transactional
    public CuentaResponse cerrar(Integer id, Authentication auth) {
        Cuenta c = buscar(id);
        if (c.getEstado() == EstadoCuenta.CERRADA) {
            throw new IllegalArgumentException("La cuenta ya está cerrada.");
        }
        List<Pedido> pedidos = pedidoRepository.findByCuentaOrderByFechaRegistroAsc(c);
        long porEntregar = contarPorEntregar(pedidos);
        if (porEntregar > 0) {
            throw new IllegalArgumentException("No se puede cerrar la cuenta: hay " + porEntregar
                    + " pedido(s) sin entregar. Entrégalos (o anula los pendientes) primero.");
        }
        c.setEstado(EstadoCuenta.CERRADA);
        c.setFechaCierre(LocalDateTime.now());
        c.setMozoCierre(auth.getName());
        c.setTotal(calcularTotal(pedidos));
        cuentaRepository.save(c);

        MesaRemota mesa = mesaRemotaService.obtener(c.getIdmesa());
        if ("OCUPADA".equals(mesa.getEstado())) {
            mesaRemotaService.liberar(c.getIdmesa());
        }
        return aResponse(c, pedidos);
    }

    public MesaRemota liberarMesaSinConsumo(Integer idmesa) {
        if (cuentaRepository.findFirstByIdmesaAndEstado(idmesa, EstadoCuenta.ABIERTA).isPresent()) {
            throw new IllegalArgumentException(
                    "La mesa tiene una cuenta abierta: ciérrala para liberar la mesa.");
        }
        long activos = pedidoRepository.countByIdmesaAndEstadoIn(idmesa, PedidoService.ACTIVOS);
        if (activos > 0) {
            throw new IllegalArgumentException(
                    "No se puede liberar la mesa: tiene " + activos + " pedido(s) sin entregar o anular.");
        }
        MesaRemota mesa = mesaRemotaService.obtener(idmesa);
        if ("LIBRE".equals(mesa.getEstado())) {
            throw new IllegalArgumentException("La mesa " + mesa.getNumero() + " ya está libre.");
        }
        return mesaRemotaService.liberar(idmesa);
    }

    private Cuenta buscar(Integer id) {
        return cuentaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("La cuenta no existe."));
    }

    private long contarPorEntregar(List<Pedido> pedidos) {
        return pedidos.stream().filter(p -> PedidoService.ACTIVOS.contains(p.getEstado())).count();
    }

    private BigDecimal calcularTotal(List<Pedido> pedidos) {
        return pedidos.stream()
                .filter(p -> p.getEstado() != ANULADO)
                .flatMap(p -> p.getDetalles().stream())
                .filter(d -> !d.isAgotado())
                .map(d -> d.getPrecioUnitario().multiply(BigDecimal.valueOf(d.getCantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private CuentaResponse aResponse(Cuenta c) {
        return aResponse(c, pedidoRepository.findByCuentaOrderByFechaRegistroAsc(c));
    }

    private CuentaResponse aResponse(Cuenta c, List<Pedido> pedidos) {
        Map<String, CuentaItemResponse> items = new LinkedHashMap<>();
        pedidos.stream()
                .filter(p -> p.getEstado() != ANULADO)
                .flatMap(p -> p.getDetalles().stream())
                .filter(d -> !d.isAgotado())
                .forEach(d -> items.merge(d.getIdplato() + "|" + d.getPrecioUnitario(), item(d), this::sumar));

        List<PedidoResponse> detallePedidos = pedidos.stream().map(pedidoService::aResponse).toList();
        return CuentaResponse.builder()
                .idcuenta(c.getIdcuenta())
                .idmesa(c.getIdmesa())
                .numeroMesa(c.getNumeroMesa())
                .comensales(c.getComensales())
                .estado(c.getEstado())
                .fechaApertura(c.getFechaApertura())
                .fechaCierre(c.getFechaCierre())
                .mozoCierre(c.getMozoCierre())
                .items(List.copyOf(items.values()))
                .total(c.getEstado() == EstadoCuenta.CERRADA ? c.getTotal() : calcularTotal(pedidos))
                .pedidosPorEntregar(contarPorEntregar(pedidos))
                .pedidos(detallePedidos)
                .build();
    }

    private CuentaItemResponse item(DetallePedido d) {
        return CuentaItemResponse.builder()
                .idplato(d.getIdplato())
                .nombrePlato(d.getNombrePlato())
                .precioUnitario(d.getPrecioUnitario())
                .cantidad(d.getCantidad())
                .subtotal(d.getPrecioUnitario().multiply(BigDecimal.valueOf(d.getCantidad())))
                .build();
    }

    private CuentaItemResponse sumar(CuentaItemResponse a, CuentaItemResponse b) {
        a.setCantidad(a.getCantidad() + b.getCantidad());
        a.setSubtotal(a.getSubtotal().add(b.getSubtotal()));
        return a;
    }
}
