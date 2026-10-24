import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { claseEstado, etiquetaEstado } from '../../core/estado.util';
import { mensajeError } from '../../core/error.util';
import { haceTexto, tiempoPedido } from '../../core/tiempo.util';
import { Mesa } from '../../models/mesa.model';
import { EstadoPedido, Pedido } from '../../models/pedido.model';
import { MesaService } from '../../services/mesa.service';
import { PedidoService } from '../../services/pedido.service';

const ACTIVOS: EstadoPedido[] = ['PENDIENTE', 'EN_PREPARACION', 'LISTO'];

@Component({
  selector: 'app-pedidos',
  imports: [RouterLink, DatePipe, DecimalPipe],
  template: `
    <div class="barra-titulo">
      <h2>Pedidos</h2>
      <div class="acciones">
        <select class="filtro-mesa" aria-label="Filtrar por mesa" (change)="filtrarMesa($any($event.target).value)">
          <option value="">Todas las mesas</option>
          @for (m of mesas(); track m.idmesa) {
            <option [value]="m.idmesa" [selected]="m.idmesa === idmesa()">Mesa {{ m.numero }}</option>
          }
        </select>
        <label class="inline">
          <input type="checkbox" [checked]="soloActivos()" (change)="alternarFiltro()" /> Solo activos
        </label>
        <a class="btn" routerLink="/pedidos/nuevo">Nuevo pedido</a>
      </div>
    </div>

    @if (listos() > 0) {
      <div class="banner">{{ listos() }} pedido(s) listo(s) para recoger en cocina</div>
    }
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @for (p of pedidos(); track p.idpedido) {
      <div class="tarjeta pedido" [class.destacado]="p.estado === 'LISTO'">
        <div class="fila">
          <strong>
            Pedido #{{ p.idpedido }} · Mesa {{ p.numeroMesa }}
            @if (p.adicional) {
              <span class="pill pill-info">Adicional</span>
            }
          </strong>
          <span [class]="clase(p.estado)">{{ etiqueta(p.estado) }}</span>
        </div>
        <p class="suave">Registrado {{ p.fechaRegistro | date: 'dd/MM HH:mm' }} por {{ p.mozo }}</p>
        @if (p.estado === 'EN_PREPARACION') {
          <p class="suave">En cocina desde {{ p.fechaPreparacion | date: 'HH:mm' }}</p>
        }
        @if (p.estado === 'LISTO') {
          <p class="aviso-listo" [class]="'semaforo-texto-' + tiempo(p).color">
            Listo {{ hace(p.fechaListo) }}: recógelo en cocina
          </p>
        }
        @if (p.estado === 'ENTREGADO') {
          <p class="suave">Entregado {{ p.fechaEntrega | date: 'HH:mm' }} por {{ p.mozoEntrega }}</p>
        }

        @if (tieneAgotados(p)) {
          <p class="aviso">La cocina avisa que un plato se agotó. Ofrece otra opción al cliente y edita el pedido (o anúlalo).</p>
        }
        <ul>
          @for (d of p.detalles; track d.iddetalle) {
            <li [class.item-agotado]="d.agotado">
              {{ d.cantidad }} × <span class="nombre-item">{{ d.nombrePlato }}</span>
              @if (d.observacion) {
                <em>({{ d.observacion }})</em>
              }
              @if (d.agotado) {
                <span class="pill pill-mal">Agotado</span>
              }
            </li>
          }
        </ul>
        <p><strong>Total: S/ {{ p.total | number: '1.2-2' }}</strong></p>

        <div class="acciones">
          @if (p.estado === 'LISTO') {
            <button class="btn btn-peq" (click)="cambiarEstado(p, 'ENTREGADO')">Entregar</button>
          }
          @if (p.estado === 'PENDIENTE') {
            <a class="btn btn-peq" [class.btn-secundario]="!tieneAgotados(p)"
               [routerLink]="['/pedidos', p.idpedido, 'editar']">{{ tieneAgotados(p) ? 'Cambiar plato' : 'Editar' }}</a>
            <button class="btn btn-peq btn-peligro" (click)="cambiarEstado(p, 'ANULADO')">Anular</button>
          }
          @if (esActivo(p)) {
            <a class="btn btn-peq btn-secundario" [routerLink]="['/mesas', p.idmesa, 'cuenta']">Cuenta de la mesa</a>
          }
          @if (p.estado === 'ANULADO' && auth.esAdmin()) {
            <button class="btn btn-peq btn-peligro" (click)="eliminar(p)">Eliminar</button>
          }
        </div>
      </div>
    } @empty {
      <p class="suave">No hay pedidos para mostrar.</p>
    }
  `,
})
export class PedidosComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private pedidoService = inject(PedidoService);
  private mesaService = inject(MesaService);

  pedidos = signal<Pedido[]>([]);
  mesas = signal<Mesa[]>([]);
  soloActivos = signal(true);
  idmesa = signal<number | undefined>(undefined);
  error = signal('');
  listos = computed(() => this.pedidos().filter((p) => p.estado === 'LISTO').length);
  private timer?: ReturnType<typeof setInterval>;

  etiqueta = etiquetaEstado;
  clase = claseEstado;
  hace = haceTexto;
  tiempo = tiempoPedido;

  ngOnInit(): void {
    const mesa = Number(this.route.snapshot.queryParamMap.get('mesa'));
    if (mesa) this.idmesa.set(mesa);
    this.mesaService.listar().subscribe({
      next: (r) => this.mesas.set(r),
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
    this.cargar();
    this.timer = setInterval(() => this.cargar(), 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  cargar(): void {
    const estados = this.soloActivos() ? ACTIVOS : undefined;
    this.pedidoService.listar(estados, this.idmesa()).subscribe({
      next: (r) => this.pedidos.set(r),
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
  }

  tieneAgotados(p: Pedido): boolean {
    return p.detalles.some((d) => d.agotado);
  }

  esActivo(p: Pedido): boolean {
    return ACTIVOS.includes(p.estado);
  }

  alternarFiltro(): void {
    this.soloActivos.update((v) => !v);
    this.cargar();
  }

  filtrarMesa(valor: string): void {
    this.idmesa.set(valor ? Number(valor) : undefined);
    this.cargar();
  }

  cambiarEstado(p: Pedido, estado: EstadoPedido): void {
    if (estado === 'ANULADO' && !confirm(`¿Anular el pedido #${p.idpedido}?`)) return;
    this.error.set('');
    this.pedidoService.cambiarEstado(p.idpedido, estado).subscribe({
      next: () => this.cargar(),
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
  }

  eliminar(p: Pedido): void {
    if (!confirm(`¿Eliminar definitivamente el pedido #${p.idpedido}?`)) return;
    this.error.set('');
    this.pedidoService.eliminar(p.idpedido).subscribe({
      next: () => this.cargar(),
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
  }
}
