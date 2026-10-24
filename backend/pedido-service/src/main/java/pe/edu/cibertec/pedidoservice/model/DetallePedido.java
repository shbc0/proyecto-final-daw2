package pe.edu.cibertec.pedidoservice.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "detalle_pedido")
public class DetallePedido {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer iddetalle;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idpedido")
    private Pedido pedido;

    @Column(nullable = false)
    private Integer idplato;

    @Column(nullable = false, length = 100)
    private String nombrePlato;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal precioUnitario;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(length = 255)
    private String observacion;

    @Column(nullable = false)
    private boolean agotado;
}
