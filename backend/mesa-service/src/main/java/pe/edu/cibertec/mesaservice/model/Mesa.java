package pe.edu.cibertec.mesaservice.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "mesa")
public class Mesa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idmesa;
    @Column(nullable = false, unique = true)
    private Integer numero;
    @Column(nullable = false)
    private Integer capacidad;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private EstadoMesa estado = EstadoMesa.LIBRE;
    private Integer comensales;
    private LocalDateTime fechaOcupacion;
}
