package pe.edu.cibertec.authservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.edu.cibertec.authservice.dto.ErrorMessage;
import pe.edu.cibertec.authservice.dto.GenericResponse;
import pe.edu.cibertec.authservice.dto.Login;
import pe.edu.cibertec.authservice.dto.UsuarioJwt;
import pe.edu.cibertec.authservice.model.Usuario;
import pe.edu.cibertec.authservice.security.JwtService;
import pe.edu.cibertec.authservice.service.DetalleUsuarioService;
import pe.edu.cibertec.authservice.service.UsuarioService;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final DetalleUsuarioService detalleUsuarioService;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;
    private final UsuarioService usuarioService;

    @PostMapping("/login")
    public ResponseEntity<GenericResponse<UsuarioJwt>> login(@RequestBody Login login) {
        try {
            authManager.authenticate(new UsernamePasswordAuthenticationToken(
                    login.getUsername(), login.getPassword()));
            Usuario usuario = usuarioService.getUsuarioByNomusuario(login.getUsername());
            List<GrantedAuthority> authorities =
                    detalleUsuarioService.getAuthorities(usuario.getRoles());
            String token = jwtService.generarToken(usuario, authorities);
            UsuarioJwt dto = UsuarioJwt.builder()
                    .idusuario(usuario.getIdusuario())
                    .nomusuario(usuario.getNomusuario())
                    .roles(authorities.stream().map(GrantedAuthority::getAuthority).toList())
                    .token(token)
                    .build();
            return ResponseEntity.ok(GenericResponse.<UsuarioJwt>builder().response(dto).build());
        } catch (AuthenticationException e) {
            GenericResponse<UsuarioJwt> response = GenericResponse.<UsuarioJwt>builder()
                    .error(ErrorMessage.builder()
                            .statusCode(401)
                            .message("Usuario y/o password incorrecto")
                            .build())
                    .build();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }
}
