package pe.edu.cibertec.pedidoservice.remoteservice;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import pe.edu.cibertec.pedidoservice.remoteservice.model.DisponibilidadRemota;
import pe.edu.cibertec.pedidoservice.remoteservice.model.PlatoRemoto;

@FeignClient(name = "carta-service")
public interface CartaClient {

    @GetMapping("/api/v1/platos/{id}")
    PlatoRemoto obtenerPlato(@PathVariable("id") Integer id);

    @PutMapping("/api/v1/platos/{id}/disponibilidad")
    PlatoRemoto cambiarDisponibilidad(@PathVariable("id") Integer id, @RequestBody DisponibilidadRemota body);
}
