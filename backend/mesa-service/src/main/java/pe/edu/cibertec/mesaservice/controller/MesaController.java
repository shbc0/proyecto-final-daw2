package pe.edu.cibertec.mesaservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.cibertec.mesaservice.dto.OcuparRequest;
import pe.edu.cibertec.mesaservice.model.EstadoMesa;
import pe.edu.cibertec.mesaservice.model.Mesa;
import pe.edu.cibertec.mesaservice.service.MesaService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/mesas")
@RequiredArgsConstructor
public class MesaController {

    private final MesaService mesaService;

    @PreAuthorize("hasAnyRole('ADMIN','MOZO','COCINA')")
    @GetMapping
    public List<Mesa> listar(@RequestParam(required = false) EstadoMesa estado) {
        return mesaService.listar(estado);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MOZO','COCINA','SERVICIO')")
    @GetMapping("/{id}")
    public Mesa obtener(@PathVariable Integer id) {
        return mesaService.obtener(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Mesa> crear(@RequestBody Mesa mesa) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mesaService.crear(mesa));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public Mesa actualizar(@PathVariable Integer id, @RequestBody Mesa mesa) {
        return mesaService.actualizar(id, mesa);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MOZO')")
    @PutMapping("/{id}/ocupar")
    public Mesa ocupar(@PathVariable Integer id, @RequestBody(required = false) OcuparRequest req) {
        return mesaService.ocupar(id, req == null ? null : req.getComensales());
    }

    @PreAuthorize("hasRole('SERVICIO')")
    @PutMapping("/{id}/liberar")
    public Mesa liberar(@PathVariable Integer id) {
        return mesaService.liberar(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        mesaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
