package pe.edu.cibertec.pedidoservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.cibertec.pedidoservice.dto.ReporteResponse;
import pe.edu.cibertec.pedidoservice.dto.ReporteResponse.HoraResumen;
import pe.edu.cibertec.pedidoservice.dto.ReporteResponse.MesaResumen;
import pe.edu.cibertec.pedidoservice.dto.ReporteResponse.MozoResumen;
import pe.edu.cibertec.pedidoservice.dto.ReporteResponse.PlatoRanking;
import pe.edu.cibertec.pedidoservice.model.Cuenta;
import pe.edu.cibertec.pedidoservice.model.EstadoCuenta;
import pe.edu.cibertec.pedidoservice.model.Pedido;
import pe.edu.cibertec.pedidoservice.repository.CuentaRepository;
import pe.edu.cibertec.pedidoservice.repository.PedidoRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import static pe.edu.cibertec.pedidoservice.model.EstadoPedido.*;

@RequiredArgsConstructor
@Service
public class ReporteService {

    private static final int TOP_PLATOS = 10;

    private final PedidoRepository pedidoRepository;
    private final CuentaRepository cuentaRepository;

    @Transactional(readOnly = true)
    public ReporteResponse resumen(LocalDate desde, LocalDate hasta) {
        if (desde == null || hasta == null || hasta.isBefore(desde)) {
            throw new IllegalArgumentException("Indica un rango de fechas válido (desde <= hasta).");
        }
        LocalDateTime ini = desde.atStartOfDay();
        LocalDateTime fin = hasta.plusDays(1).atStartOfDay();
        List<Pedido> pedidos = pedidoRepository.findByFechaRegistroGreaterThanEqualAndFechaRegistroLessThan(ini, fin);
        List<Cuenta> cuentas = cuentaRepository
                .findByEstadoAndFechaCierreGreaterThanEqualAndFechaCierreLessThan(EstadoCuenta.CERRADA, ini, fin);
        List<Pedido> entregados = pedidos.stream().filter(p -> p.getEstado() == ENTREGADO).toList();

        BigDecimal ventas = cuentas.stream().map(Cuenta::getTotal).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ReporteResponse.builder()
                .desde(desde)
                .hasta(hasta)
                .pedidosRegistrados(pedidos.size())
                .pedidosEntregados(entregados.size())
                .pedidosAnulados(pedidos.stream().filter(p -> p.getEstado() == ANULADO).count())
                .pedidosEnCurso(pedidos.stream().filter(p -> PedidoService.ACTIVOS.contains(p.getEstado())).count())
                .platosAgotados(pedidos.stream().mapToLong(Pedido::getPlatosAgotados).sum())
                .minutosEspera(promedio(pedidos, Pedido::getFechaRegistro, Pedido::getFechaPreparacion))
                .minutosPreparacion(promedio(pedidos, Pedido::getFechaPreparacion, Pedido::getFechaListo))
                .minutosPase(promedio(pedidos, Pedido::getFechaListo, Pedido::getFechaEntrega))
                .minutosTotal(promedio(pedidos, Pedido::getFechaRegistro, Pedido::getFechaEntrega))
                .cuentasCerradas(cuentas.size())
                .ventas(ventas)
                .ticketPromedio(cuentas.isEmpty() ? BigDecimal.ZERO
                        : ventas.divide(BigDecimal.valueOf(cuentas.size()), 2, RoundingMode.HALF_UP))
                .comensales(cuentas.stream().map(Cuenta::getComensales).filter(Objects::nonNull)
                        .mapToLong(Integer::longValue).sum())
                .minutosOcupacionMesa(promedio(cuentas, Cuenta::getFechaApertura, Cuenta::getFechaCierre))
                .platosTop(platosTop(entregados))
                .porMozo(porMozo(pedidos))
                .porMesa(porMesa(cuentas))
                .porHora(porHora(pedidos))
                .build();
    }

    private <T> Double promedio(List<T> lista, Function<T, LocalDateTime> desde, Function<T, LocalDateTime> hasta) {
        OptionalDouble prom = lista.stream()
                .filter(x -> desde.apply(x) != null && hasta.apply(x) != null)
                .mapToDouble(x -> Duration.between(desde.apply(x), hasta.apply(x)).toSeconds() / 60.0)
                .average();
        return prom.isPresent() ? Math.round(prom.getAsDouble() * 10) / 10.0 : null;
    }

    private List<PlatoRanking> platosTop(List<Pedido> entregados) {
        Map<Integer, PlatoRanking> porPlato = new HashMap<>();
        entregados.stream().flatMap(p -> p.getDetalles().stream()).filter(d -> !d.isAgotado()).forEach(d -> {
            BigDecimal importe = d.getPrecioUnitario().multiply(BigDecimal.valueOf(d.getCantidad()));
            porPlato.merge(d.getIdplato(),
                    PlatoRanking.builder().nombrePlato(d.getNombrePlato()).cantidad(d.getCantidad()).importe(importe).build(),
                    (a, b) -> {
                        a.setCantidad(a.getCantidad() + b.getCantidad());
                        a.setImporte(a.getImporte().add(b.getImporte()));
                        return a;
                    });
        });
        return porPlato.values().stream()
                .sorted(Comparator.comparingLong(PlatoRanking::getCantidad).reversed()
                        .thenComparing(PlatoRanking::getNombrePlato))
                .limit(TOP_PLATOS)
                .toList();
    }

    private List<MozoResumen> porMozo(List<Pedido> pedidos) {
        Set<String> mozos = new TreeSet<>();
        pedidos.forEach(p -> {
            mozos.add(p.getMozo());
            if (p.getMozoEntrega() != null) mozos.add(p.getMozoEntrega());
        });
        return mozos.stream().map(m -> MozoResumen.builder()
                        .mozo(m)
                        .registrados(pedidos.stream().filter(p -> m.equals(p.getMozo())).count())
                        .entregados(pedidos.stream().filter(p -> m.equals(p.getMozoEntrega())).count())
                        .anulados(pedidos.stream().filter(p -> m.equals(p.getMozo()) && p.getEstado() == ANULADO).count())
                        .build())
                .toList();
    }

    private List<MesaResumen> porMesa(List<Cuenta> cuentas) {
        Map<Integer, List<Cuenta>> grupos = cuentas.stream()
                .collect(Collectors.groupingBy(Cuenta::getNumeroMesa, TreeMap::new, Collectors.toList()));
        return grupos.entrySet().stream().map(e -> MesaResumen.builder()
                        .numeroMesa(e.getKey())
                        .cuentas(e.getValue().size())
                        .ventas(e.getValue().stream().map(Cuenta::getTotal).filter(Objects::nonNull)
                                .reduce(BigDecimal.ZERO, BigDecimal::add))
                        .minutosPromedio(promedio(e.getValue(), Cuenta::getFechaApertura, Cuenta::getFechaCierre))
                        .build())
                .toList();
    }

    private List<HoraResumen> porHora(List<Pedido> pedidos) {
        if (pedidos.isEmpty()) return List.of();
        Map<Integer, Long> conteo = pedidos.stream()
                .collect(Collectors.groupingBy(p -> p.getFechaRegistro().getHour(), Collectors.counting()));
        int min = Collections.min(conteo.keySet());
        int max = Collections.max(conteo.keySet());
        List<HoraResumen> horas = new ArrayList<>();
        for (int h = min; h <= max; h++) {
            horas.add(HoraResumen.builder().hora(h).pedidos(conteo.getOrDefault(h, 0L)).build());
        }
        return horas;
    }
}
