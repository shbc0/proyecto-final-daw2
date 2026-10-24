package pe.edu.cibertec.pedidoservice.dto;

import lombok.Builder;
import lombok.Data;
import pe.edu.cibertec.pedidoservice.model.EstadoCuenta;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Builder
@Data
public class CuentaResponse {
    private Integer idcuenta;
    private Integer idmesa;
    private Integer numeroMesa;
    private Integer comensales;
    private EstadoCuenta estado;
    private LocalDateTime fechaApertura;
    private LocalDateTime fechaCierre;
    private String mozoCierre;
    private List<CuentaItemResponse> items;
    private BigDecimal total;
    private long pedidosPorEntregar;
    private List<PedidoResponse> pedidos;
}
