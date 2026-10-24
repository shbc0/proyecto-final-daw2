package pe.edu.cibertec.authservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.cibertec.authservice.model.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    Usuario findByNomusuario(String nomusuario);
    boolean existsByNomusuario(String nomusuario);
    boolean existsByEmail(String email);
    boolean existsByEmailAndIdusuarioNot(String email, Integer idusuario);
}
