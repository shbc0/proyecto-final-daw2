package pe.edu.cibertec.authservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.cibertec.authservice.dto.UsuarioRegistroDto;
import pe.edu.cibertec.authservice.dto.UsuarioResponse;
import pe.edu.cibertec.authservice.model.Rol;
import pe.edu.cibertec.authservice.model.Usuario;
import pe.edu.cibertec.authservice.repository.RolRepository;
import pe.edu.cibertec.authservice.repository.UsuarioRepository;

import java.util.HashSet;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;

@RequiredArgsConstructor
@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final RolRepository rolRepository;

    public Usuario getUsuarioByNomusuario(String nomusuario) {
        return usuarioRepository.findByNomusuario(nomusuario);
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAll().stream().map(this::aResponse).toList();
    }

    @Transactional
    public UsuarioResponse crear(UsuarioRegistroDto dto) {
        if (vacio(dto.getNomusuario()) || vacio(dto.getEmail()) || vacio(dto.getPassword())) {
            throw new IllegalArgumentException("Usuario, correo y contraseña son obligatorios.");
        }
        if (usuarioRepository.existsByNomusuario(dto.getNomusuario())) {
            throw new IllegalArgumentException("El nombre de usuario ya está en uso.");
        }
        if (usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("El correo electrónico ya está en uso.");
        }
        Usuario nuevo = new Usuario();
        nuevo.setNomusuario(dto.getNomusuario().trim());
        nuevo.setEmail(dto.getEmail().trim());
        nuevo.setPassword(passwordEncoder.encode(dto.getPassword()));
        nuevo.setNombres(dto.getNombres());
        nuevo.setApellidos(dto.getApellidos());
        nuevo.setActivo(dto.getActivo() == null || dto.getActivo());
        nuevo.setRoles(resolverRoles(dto.getRolesIds()));
        return aResponse(usuarioRepository.save(nuevo));
    }

    @Transactional
    public UsuarioResponse actualizar(Integer id, UsuarioRegistroDto dto, String usuarioActual) {
        Usuario u = usuarioRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("El usuario no existe."));

        if (!vacio(dto.getEmail()) && !dto.getEmail().equals(u.getEmail())) {
            if (usuarioRepository.existsByEmailAndIdusuarioNot(dto.getEmail(), id)) {
                throw new IllegalArgumentException("El correo electrónico ya está en uso.");
            }
            u.setEmail(dto.getEmail().trim());
        }
        if (dto.getNombres() != null) u.setNombres(dto.getNombres());
        if (dto.getApellidos() != null) u.setApellidos(dto.getApellidos());
        if (!vacio(dto.getPassword())) u.setPassword(passwordEncoder.encode(dto.getPassword()));
        if (dto.getActivo() != null) {
            if (!dto.getActivo() && u.getNomusuario().equals(usuarioActual)) {
                throw new IllegalArgumentException("No puedes desactivar tu propia cuenta.");
            }
            u.setActivo(dto.getActivo());
        }
        if (dto.getRolesIds() != null && !dto.getRolesIds().isEmpty()) {
            u.setRoles(resolverRoles(dto.getRolesIds()));
        }
        return aResponse(usuarioRepository.save(u));
    }

    @Transactional
    public void eliminar(Integer id, String usuarioActual) {
        Usuario u = usuarioRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("El usuario no existe."));
        if (u.getNomusuario().equals(usuarioActual)) {
            throw new IllegalArgumentException("No puedes eliminar tu propia cuenta.");
        }
        usuarioRepository.delete(u);
    }

    private Set<Rol> resolverRoles(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new IllegalArgumentException("Asigna al menos un rol.");
        }
        List<Rol> encontrados = rolRepository.findAllById(ids);
        if (encontrados.size() != ids.size()) {
            throw new IllegalArgumentException("Uno o más roles no existen.");
        }
        return new HashSet<>(encontrados);
    }

    private UsuarioResponse aResponse(Usuario u) {
        return UsuarioResponse.builder()
                .idusuario(u.getIdusuario())
                .nomusuario(u.getNomusuario())
                .email(u.getEmail())
                .nombres(u.getNombres())
                .apellidos(u.getApellidos())
                .activo(u.isActivo())
                .roles(u.getRoles().stream().map(Rol::getNomrol).sorted().toList())
                .build();
    }

    private boolean vacio(String s) {
        return s == null || s.isBlank();
    }
}
