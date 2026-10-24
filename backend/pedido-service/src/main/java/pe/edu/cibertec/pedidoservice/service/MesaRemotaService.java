package pe.edu.cibertec.pedidoservice.service;

import feign.FeignException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import pe.edu.cibertec.pedidoservice.remoteservice.MesaClient;
import pe.edu.cibertec.pedidoservice.remoteservice.model.MesaRemota;

@RequiredArgsConstructor
@Service
public class MesaRemotaService {

    private final MesaClient mesaClient;

    @Value("${app.internal.key}")
    private String claveInterna;

    public MesaRemota obtener(Integer id) {
        try {
            return mesaClient.obtenerMesa(id);
        } catch (FeignException.NotFound e) {
            throw new IllegalArgumentException("La mesa con id " + id + " no existe.");
        } catch (RuntimeException e) {
            throw new ServicioNoDisponibleException("No se pudo consultar las mesas (mesa-service).");
        }
    }

    public MesaRemota liberar(Integer id) {
        try {
            return mesaClient.liberar(id, claveInterna);
        } catch (RuntimeException e) {
            throw new ServicioNoDisponibleException("No se pudo liberar la mesa (mesa-service).");
        }
    }
}
