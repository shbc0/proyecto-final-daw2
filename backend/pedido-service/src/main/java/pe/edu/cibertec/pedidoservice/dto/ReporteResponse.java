package pe.edu.cibertec.pedidoservice.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Builder
@Data
public class ReporteResponse {
    private LocalDate desde;
    private LocalDate hasta;

    private long pedidosRegistrados;
    private long pedidosEntregados;
    private long pedidosAnulados;
    private long pedidosEnCurso;
    private long platosAgotados;

    private Double minutosEspera;
    private Double minutosPreparacion;
    private Double minutosPase;
    private Double minutosTotal;

    private long cuentasCerradas;
    private BigDecimal ventas;
    private BigDecimal ticketPromedio;
    private long comensales;
    private Double minutosOcupacionMesa;

    private List<PlatoRanking> platosTop;
    private List<MozoResumen> porMozo;
    private List<MesaResumen> porMesa;
    private List<HoraResumen> porHora;

    @Builder
    @Data
    public static class PlatoRanking {
        private String nombrePlato;
        private long cantidad;
        private BigDecimal importe;
    }

    @Builder
    @Data
    public static class MozoResumen {
        private String mozo;
        private long registrados;
        private long entregados;
        private long anulados;
    }

    @Builder
    @Data
    public static class MesaResumen {
        private Integer numeroMesa;
        private long cuentas;
        private BigDecimal ventas;
        private Double minutosPromedio;
    }

    @Builder
    @Data
    public static class HoraResumen {
        private int hora;
        private long pedidos;
    }
}
