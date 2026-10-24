package pe.edu.cibertec.authservice.dto;

import lombok.Data;

import java.util.List;

@Data
public class UsuarioRegistroDto {
    private String nomusuario;
    private String email;
    private String password;
    private String nombres;
    private String apellidos;
    private Boolean activo;
    private List<Integer> rolesIds;
}
