package pe.edu.cibertec.cartaservice.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import pe.edu.cibertec.cartaservice.model.Plato;
import pe.edu.cibertec.cartaservice.repository.PlatoRepository;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final PlatoRepository platoRepository;

    @Override
    public void run(String... args) {
        if (platoRepository.count() > 0) return;
        guardar("Ceviche clásico", "Pescado fresco, limón, ají y camote", "35.00", "Entradas");
        guardar("Causa limeña", "Papa amarilla rellena de pollo", "22.00", "Entradas");
        guardar("Lomo saltado", "Lomo fino con cebolla, tomate y papas fritas", "32.50", "Fondos");
        guardar("Ají de gallina", "Pollo deshilachado en crema de ají amarillo", "28.00", "Fondos");
        guardar("Suspiro limeño", "Dulce de leche con merengue", "14.00", "Postres");
        guardar("Chicha morada", "Jarra de 1 litro", "12.00", "Bebidas");
    }

    private void guardar(String nombre, String desc, String precio, String categoria) {
        Plato p = new Plato();
        p.setNombre(nombre);
        p.setDescripcion(desc);
        p.setPrecio(new BigDecimal(precio));
        p.setCategoria(categoria);
        p.setDisponible(true);
        platoRepository.save(p);
    }
}
