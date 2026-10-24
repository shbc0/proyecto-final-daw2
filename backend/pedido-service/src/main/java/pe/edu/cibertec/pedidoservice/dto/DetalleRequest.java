package pe.edu.cibertec.pedidoservice.dto;

import lombok.Data;

@Data
public class DetalleRequest {
    private Integer idplato;
    private Integer cantidad;
    private String observacion;
}
