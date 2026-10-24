package pe.edu.cibertec.pedidoservice.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Builder
@Data
public class DetalleResponse {
    private Integer iddetalle;
    private Integer idplato;
    private String nombrePlato;
    private BigDecimal precioUnitario;
    private Integer cantidad;
    private String observacion;
    private BigDecimal subtotal;
    private boolean agotado;
}
