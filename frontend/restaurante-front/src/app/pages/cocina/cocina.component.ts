import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { mensajeError } from '../../core/error.util';
import { tiempoPedido } from '../../core/tiempo.util';
import { DetallePedido, EstadoPedido, Pedido } from '../../models/pedido.model';
import { PedidoService } from '../../services/pedido.service';

interface Columna {
  titulo: string;
  estado: EstadoPedido;
}

@Component({
  selector: 'app-cocina',
  imports: [DatePipe],
  template: `
    <div class="barra-titulo">
      <h2>Cola de cocina</h2>
      <span class="suave">Se actualiza sola cada 5 segundos · orden de llegada</span>
    </div>
    <p class="leyenda suave">
      <span class="punto semaforo-verde"></span> a tiempo
      <span class="punto semaforo-ambar"></span> atención
      <span class="punto semaforo-rojo"></span> demorado
    </p>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    <div class="columnas">
      @for (col of columnas; track col.estado) {
        <section>
          <h3>{{ col.titulo }} ({{ pedidosDe(col.estado).length }})</h3>

          @for (p of pedidosDe(col.estado); track p.idpedido) {
            <div class="tarjeta pedido" [class]="'tarjeta pedido semaforo-' + tiempo(p).color">
              <div class="fila">
                <strong>
                  Mesa {{ p.numeroMesa }}
                  @if (p.adicional) {
                    <span class="pill pill-info">Adicional</span>
                  }
                </strong>
                <span class="suave">#{{ p.idpedido }} · {{ p.fechaRegistro | date: 'HH:mm' }}</span>
              </div>
              <p class="suave">
                Mozo: {{ p.mozo }} ·
                <span class="tiempo" [class]="'tiempo semaforo-texto-' + tiempo(p).color">{{ tiempo(p).texto }}</span>
              </p>
              <ul>
                @for (d of p.detalles; track d.iddetalle) {
                  <li class="item-cocina" [class.item-agotado]="d.agotado">
                    <span>
                      <strong>{{ d.cantidad }} ×</strong>&nbsp;<span class="nombre-item">{{ d.nombrePlato }}</span>
                      @if (d.observacion) {
                        <em> — {{ d.observacion }}</em>
                      }
                    </span>
                    @if (d.agotado) {
                      <span class="pill pill-mal">Agotado</span>
                    } @else if (col.estado === 'PENDIENTE') {
                      <button class="btn btn-peq btn-secundario" (click)="agotado(p, d)">Agotado</button>
                    }
                  </li>
                }
              </ul>

              @if (col.estado === 'PENDIENTE') {
                @if (tieneAgotados(p)) {
                  <p class="aviso">Esperando que el mozo cambie el plato agotado o anule el pedido.</p>
                } @else {
                  <button class="btn" (click)="mover(p, 'EN_PREPARACION')">Empezar a preparar</button>
                }
              }
              @if (col.estado === 'EN_PREPARACION') {
                <button class="btn" (click)="mover(p, 'LISTO')">Marcar listo</button>
              }
              @if (col.estado === 'LISTO') {
                <span class="pill pill-ok">Esperando al mozo</span>
              }
            </div>
          } @empty {
            <p class="suave">Sin pedidos.</p>
          }
        </section>
      }
    </div>
  `,
})
export class CocinaComponent implements OnInit, OnDestroy {
  private pedidoService = inject(PedidoService);

  pedidos = signal<Pedido[]>([]);
  error = signal('');
  private timer?: ReturnType<typeof setInterval>;

  columnas: Columna[] = [
    { titulo: 'Pendientes', estado: 'PENDIENTE' },
    { titulo: 'En preparación', estado: 'EN_PREPARACION' },
    { titulo: 'Listos', estado: 'LISTO' },
  ];

  ngOnInit(): void {
    this.cargar();
    this.timer = setInterval(() => this.cargar(), 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  pedidosDe(estado: EstadoPedido): Pedido[] {
    return this.pedidos().filter((p) => p.estado === estado);
  }

  tiempo = tiempoPedido;

  cargar(): void {
    this.pedidoService.listar(['PENDIENTE', 'EN_PREPARACION', 'LISTO']).subscribe({
      next: (r) => {
        this.pedidos.set(r);
        this.error.set('');
      },
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
  }

  tieneAgotados(p: Pedido): boolean {
    return p.detalles.some((d) => d.agotado);
  }

  agotado(p: Pedido, d: DetallePedido): void {
    if (!confirm(`¿"${d.nombrePlato}" se agotó? Se avisará al mozo de la mesa ${p.numeroMesa} y el plato dejará de ofrecerse en la carta.`)) {
      return;
    }
    this.error.set('');
    this.pedidoService.marcarAgotado(p.idpedido, d.iddetalle).subscribe({
      next: () => this.cargar(),
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
  }

  mover(p: Pedido, estado: EstadoPedido): void {
    this.error.set('');
    this.pedidoService.cambiarEstado(p.idpedido, estado).subscribe({
      next: () => this.cargar(),
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
  }
}
