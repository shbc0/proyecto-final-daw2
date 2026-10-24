package pe.edu.cibertec.authservice.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import pe.edu.cibertec.authservice.model.Rol;
import pe.edu.cibertec.authservice.model.Usuario;
import pe.edu.cibertec.authservice.repository.RolRepository;
import pe.edu.cibertec.authservice.repository.UsuarioRepository;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        Rol admin = obtenerRol("ADMIN");
        Rol mozo = obtenerRol("MOZO");
        Rol cocina = obtenerRol("COCINA");

        crearUsuario("admin", "admin@restaurante.com", "admin123", "Administrador", "Sistema", admin);
        crearUsuario("mozo", "mozo@restaurante.com", "mozo123", "Mozo", "Demo", mozo);
        crearUsuario("cocina", "cocina@restaurante.com", "cocina123", "Cocina", "Demo", cocina);
    }

    private Rol obtenerRol(String nombre) {
        Rol rol = rolRepository.findByNomrol(nombre);
        if (rol == null) {
            rol = new Rol();
            rol.setNomrol(nombre);
            rol = rolRepository.save(rol);
        }
        return rol;
    }

    private void crearUsuario(String user, String email, String pass,
                              String nombres, String apellidos, Rol rol) {
        if (usuarioRepository.existsByNomusuario(user)) return;
        Usuario u = new Usuario();
        u.setNomusuario(user);
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(pass));
        u.setNombres(nombres);
        u.setApellidos(apellidos);
        u.setActivo(true);
        u.setRoles(Set.of(rol));
        usuarioRepository.save(u);
    }
}
