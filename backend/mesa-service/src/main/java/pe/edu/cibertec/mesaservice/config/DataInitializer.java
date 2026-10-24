package pe.edu.cibertec.mesaservice.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import pe.edu.cibertec.mesaservice.model.Mesa;
import pe.edu.cibertec.mesaservice.repository.MesaRepository;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final MesaRepository mesaRepository;

    @Override
    public void run(String... args) {
        if (mesaRepository.count() > 0) return;
        int[] capacidades = {2, 2, 4, 4, 6, 8};
        for (int i = 0; i < capacidades.length; i++) {
            Mesa m = new Mesa();
            m.setNumero(i + 1);
            m.setCapacidad(capacidades[i]);
            mesaRepository.save(m);
        }
    }
}
