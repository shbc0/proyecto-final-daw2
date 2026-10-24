package pe.edu.cibertec.pedidoservice.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Builder
@Data
public class CuentaItemResponse {
    private Integer idplato;
    private String nombrePlato;
    private BigDecimal precioUnitario;
    private Integer cantidad;
    private BigDecimal subtotal;
}
