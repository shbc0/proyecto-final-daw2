package pe.edu.cibertec.authservice.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Builder
@Data
public class UsuarioResponse {
    private Integer idusuario;
    private String nomusuario;
    private String email;
    private String nombres;
    private String apellidos;
    private boolean activo;
    private List<String> roles;
}
