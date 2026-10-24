package pe.edu.cibertec.pedidoservice.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "cuenta")
public class Cuenta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idcuenta;

    @Column(nullable = false)
    private Integer idmesa;

    @Column(nullable = false)
    private Integer numeroMesa;

    private Integer comensales;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private EstadoCuenta estado = EstadoCuenta.ABIERTA;

    @Column(nullable = false)
    private LocalDateTime fechaApertura;

    private LocalDateTime fechaCierre;

    @Column(length = 50)
    private String mozoCierre;

    @Column(precision = 10, scale = 2)
    private BigDecimal total;
}
