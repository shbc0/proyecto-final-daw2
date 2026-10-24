package pe.edu.cibertec.authservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.edu.cibertec.authservice.model.Rol;
import pe.edu.cibertec.authservice.repository.RolRepository;

import java.util.List;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class RolController {

    private final RolRepository rolRepository;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<Rol> listar() {
        return rolRepository.findAll();
    }
}
