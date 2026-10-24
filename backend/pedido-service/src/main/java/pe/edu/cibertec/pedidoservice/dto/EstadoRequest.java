package pe.edu.cibertec.pedidoservice.dto;

import lombok.Data;
import pe.edu.cibertec.pedidoservice.model.EstadoPedido;

@Data
public class EstadoRequest {
    private EstadoPedido estado;
}
