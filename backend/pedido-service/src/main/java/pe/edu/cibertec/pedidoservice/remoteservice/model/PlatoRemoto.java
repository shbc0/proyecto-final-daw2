package pe.edu.cibertec.pedidoservice.remoteservice.model;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PlatoRemoto {
    private Integer idplato;
    private String nombre;
    private BigDecimal precio;
    private Boolean disponible;
}
