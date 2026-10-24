package pe.edu.cibertec.pedidoservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.cibertec.pedidoservice.dto.CuentaResponse;
import pe.edu.cibertec.pedidoservice.service.CuentaService;

@RestController
@RequestMapping("/api/v1/cuentas")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','MOZO')")
public class CuentaController {

    private final CuentaService cuentaService;

    @GetMapping("/mesa/{idmesa}")
    public CuentaResponse abiertaDeMesa(@PathVariable Integer idmesa) {
        return cuentaService.obtenerAbiertaDeMesa(idmesa);
    }

    @GetMapping("/{id}")
    public CuentaResponse obtener(@PathVariable Integer id) {
        return cuentaService.obtener(id);
    }

    @PutMapping("/{id}/cerrar")
    public CuentaResponse cerrar(@PathVariable Integer id, Authentication auth) {
        return cuentaService.cerrar(id, auth);
    }
}
