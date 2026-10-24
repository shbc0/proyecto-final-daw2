package pe.edu.cibertec.pedidoservice.remoteservice;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import pe.edu.cibertec.pedidoservice.remoteservice.model.MesaRemota;

@FeignClient(name = "mesa-service")
public interface MesaClient {

    @GetMapping("/api/v1/mesas/{id}")
    MesaRemota obtenerMesa(@PathVariable("id") Integer id);

    @PutMapping("/api/v1/mesas/{id}/liberar")
    MesaRemota liberar(@PathVariable("id") Integer id,
                       @RequestHeader("X-Internal-Key") String claveInterna);
}
