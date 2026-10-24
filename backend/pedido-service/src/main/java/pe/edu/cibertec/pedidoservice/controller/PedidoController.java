package pe.edu.cibertec.pedidoservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.cibertec.pedidoservice.dto.EstadoRequest;
import pe.edu.cibertec.pedidoservice.dto.PedidoRequest;
import pe.edu.cibertec.pedidoservice.dto.PedidoResponse;
import pe.edu.cibertec.pedidoservice.model.EstadoPedido;
import pe.edu.cibertec.pedidoservice.remoteservice.model.MesaRemota;
import pe.edu.cibertec.pedidoservice.service.CuentaService;
import pe.edu.cibertec.pedidoservice.service.PedidoService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pedidos")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;
    private final CuentaService cuentaService;

    @PreAuthorize("hasAnyRole('ADMIN','MOZO','COCINA')")
    @GetMapping
    public List<PedidoResponse> listar(@RequestParam(required = false) List<EstadoPedido> estados,
                                       @RequestParam(required = false) Integer idmesa) {
        return pedidoService.listar(estados, idmesa);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MOZO','COCINA')")
    @GetMapping("/{id}")
    public PedidoResponse obtener(@PathVariable Integer id) {
        return pedidoService.obtener(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MOZO')")
    @PostMapping
    public ResponseEntity<PedidoResponse> crear(@RequestBody PedidoRequest req, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoService.crear(req, auth));
    }

    @PreAuthorize("hasAnyRole('ADMIN','MOZO')")
    @PutMapping("/{id}")
    public PedidoResponse actualizar(@PathVariable Integer id, @RequestBody PedidoRequest req) {
        return pedidoService.actualizar(id, req);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MOZO','COCINA')")
    @PutMapping("/{id}/estado")
    public PedidoResponse cambiarEstado(@PathVariable Integer id,
                                        @RequestBody EstadoRequest req,
                                        Authentication auth) {
        return pedidoService.cambiarEstado(id, req.getEstado(), auth);
    }

    @PreAuthorize("hasAnyRole('ADMIN','COCINA')")
    @PutMapping("/{id}/detalles/{iddetalle}/agotado")
    public PedidoResponse marcarAgotado(@PathVariable Integer id, @PathVariable Integer iddetalle) {
        return pedidoService.marcarAgotado(id, iddetalle);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MOZO')")
    @PutMapping("/mesa/{idmesa}/liberar")
    public MesaRemota liberarMesa(@PathVariable Integer idmesa) {
        return cuentaService.liberarMesaSinConsumo(idmesa);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        pedidoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
