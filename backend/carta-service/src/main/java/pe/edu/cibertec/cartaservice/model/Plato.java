package pe.edu.cibertec.cartaservice.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "plato")
public class Plato {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idplato;
    @Column(nullable = false, length = 100)
    private String nombre;
    @Column(length = 255)
    private String descripcion;
    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal precio;
    @Column(length = 50)
    private String categoria;
    @Column(nullable = false)
    private Boolean disponible = true;
}
