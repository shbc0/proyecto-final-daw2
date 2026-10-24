package pe.edu.cibertec.pedidoservice.dto;

import lombok.Builder;
import lombok.Data;
import pe.edu.cibertec.pedidoservice.model.EstadoPedido;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Builder
@Data
public class PedidoResponse {
    private Integer idpedido;
    private Integer idmesa;
    private Integer numeroMesa;
    private Integer idcuenta;
    private boolean adicional;
    private String mozo;
    private String mozoEntrega;
    private EstadoPedido estado;
    private LocalDateTime fechaRegistro;
    private LocalDateTime fechaPreparacion;
    private LocalDateTime fechaListo;
    private LocalDateTime fechaEntrega;
    private LocalDateTime fechaAnulacion;
    private BigDecimal total;
    private List<DetalleResponse> detalles;
}
