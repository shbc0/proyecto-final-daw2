package pe.edu.cibertec.cartaservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.cibertec.cartaservice.dto.DisponibilidadDto;
import pe.edu.cibertec.cartaservice.model.Plato;
import pe.edu.cibertec.cartaservice.service.PlatoService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/platos")
@RequiredArgsConstructor
public class PlatoController {

    private final PlatoService platoService;

    @PreAuthorize("hasAnyRole('ADMIN','MOZO','COCINA')")
    @GetMapping
    public List<Plato> listar(@RequestParam(defaultValue = "false") boolean disponibles) {
        return platoService.listar(disponibles);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MOZO','COCINA')")
    @GetMapping("/{id}")
    public Plato obtener(@PathVariable Integer id) {
        return platoService.obtener(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Plato> crear(@RequestBody Plato plato) {
        return ResponseEntity.status(HttpStatus.CREATED).body(platoService.crear(plato));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public Plato actualizar(@PathVariable Integer id, @RequestBody Plato plato) {
        return platoService.actualizar(id, plato);
    }

    @PreAuthorize("hasAnyRole('ADMIN','COCINA')")
    @PutMapping("/{id}/disponibilidad")
    public Plato cambiarDisponibilidad(@PathVariable Integer id, @RequestBody DisponibilidadDto dto) {
        return platoService.cambiarDisponibilidad(id, dto.getDisponible());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        platoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
