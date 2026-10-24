package pe.edu.cibertec.pedidoservice.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "pedido")
public class Pedido {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idpedido;

    @Column(nullable = false)
    private Integer idmesa;

    @Column(nullable = false)
    private Integer numeroMesa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idcuenta")
    private Cuenta cuenta;

    @Column(nullable = false)
    private boolean adicional;

    @Column(nullable = false)
    private int platosAgotados;

    @Column(nullable = false, length = 50)
    private String mozo;

    @Column(length = 50)
    private String mozoEntrega;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoPedido estado = EstadoPedido.PENDIENTE;

    @Column(nullable = false)
    private LocalDateTime fechaRegistro;
    private LocalDateTime fechaPreparacion;
    private LocalDateTime fechaListo;
    private LocalDateTime fechaEntrega;
    private LocalDateTime fechaAnulacion;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<DetallePedido> detalles = new ArrayList<>();
}
