package pe.edu.cibertec.authservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.cibertec.authservice.model.Rol;

public interface RolRepository extends JpaRepository<Rol, Integer> {
    Rol findByNomrol(String nomrol);
}
