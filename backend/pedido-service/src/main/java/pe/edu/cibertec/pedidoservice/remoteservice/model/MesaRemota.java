package pe.edu.cibertec.pedidoservice.remoteservice.model;

import lombok.Data;

@Data
public class MesaRemota {
    private Integer idmesa;
    private Integer numero;
    private Integer capacidad;
    private String estado;
    private Integer comensales;
}
