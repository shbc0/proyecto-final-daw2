package pe.edu.cibertec.pedidoservice.dto;

import lombok.Data;

import java.util.List;

@Data
public class PedidoRequest {
    private Integer idmesa;
    private List<DetalleRequest> detalles;
}
