package pe.edu.cibertec.authservice.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Builder
@Data
public class UsuarioJwt {
    private Integer idusuario;
    private String nomusuario;
    private List<String> roles;
    private String token;
}
