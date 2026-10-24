import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { claseEstado, etiquetaEstado } from '../../core/estado.util';
import { mensajeError } from '../../core/error.util';
import { Cuenta } from '../../models/cuenta.model';
import { CuentaService } from '../../services/cuenta.service';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-cuenta',
  imports: [RouterLink, DatePipe, DecimalPipe],
  template: `
    <div class="barra-titulo no-print">
      <h2>Cuenta de la mesa</h2>
      <a class="btn btn-secundario" routerLink="/mesas">Volver a mesas</a>
    </div>

    @if (error()) {
      <p class="error no-print">{{ error() }}</p>
    }

    @if (sinConsumo()) {
      <div class="tarjeta">
        <p>Esta mesa no tiene pedidos registrados.</p>
        <p class="suave">Si los comensales se retiraron sin pedir, puedes liberarla.</p>
        <div class="acciones">
          <a class="btn" routerLink="/pedidos/nuevo" [queryParams]="{ mesa: idmesa }">Tomar pedido</a>
          <button class="btn btn-secundario" (click)="liberarSinConsumo()">Liberar mesa</button>
        </div>
      </div>
    }

    @if (cuenta(); as c) {
      <div class="tarjeta cuenta">
        <div class="fila">
          <h3>Mesa {{ c.numeroMesa }}</h3>
          <span class="pill" [class.pill-warn]="c.estado === 'ABIERTA'" [class.pill-gris]="c.estado === 'CERRADA'">
            {{ c.estado === 'ABIERTA' ? 'Abierta' : 'Cerrada' }}
          </span>
        </div>
        <p class="suave">
          Cuenta #{{ c.idcuenta }} · Apertura {{ c.fechaApertura | date: 'dd/MM HH:mm' }}
          @if (c.comensales) {
            · {{ c.comensales }} comensales
          }
        </p>
        @if (c.fechaCierre) {
          <p class="suave">Cerrada {{ c.fechaCierre | date: 'dd/MM HH:mm' }} por {{ c.mozoCierre }}</p>
        }

        <table class="tabla-cuenta">
          <thead>
            <tr><th>Cant.</th><th>Plato</th><th class="num">P. unit.</th><th class="num">Subtotal</th></tr>
          </thead>
          <tbody>
            @for (i of c.items; track i.idplato + '-' + i.precioUnitario) {
              <tr>
                <td>{{ i.cantidad }}</td>
                <td>{{ i.nombrePlato }}</td>
                <td class="num">{{ i.precioUnitario | number: '1.2-2' }}</td>
                <td class="num">{{ i.subtotal | number: '1.2-2' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="4">Sin consumos (todos los pedidos fueron anulados).</td></tr>
            }
          </tbody>
          <tfoot>
            <tr><th colspan="3">Total</th><th class="num">S/ {{ c.total | number: '1.2-2' }}</th></tr>
          </tfoot>
        </table>
      </div>

      <div class="tarjeta no-print">
        <h3>Pedidos de la mesa</h3>
        @for (p of c.pedidos; track p.idpedido) {
          <div class="fila linea-pedido">
            <span>
              #{{ p.idpedido }} · {{ p.fechaRegistro | date: 'HH:mm' }}
              @if (p.adicional) {
                <span class="pill pill-info">Adicional</span>
              }
            </span>
            <span>
              <span [class]="clase(p.estado)">{{ etiqueta(p.estado) }}</span>
              S/ {{ p.total | number: '1.2-2' }}
            </span>
          </div>
        }

        @if (c.estado === 'ABIERTA') {
          @if (c.pedidosPorEntregar > 0) {
            <p class="aviso">
              Hay {{ c.pedidosPorEntregar }} pedido(s) sin entregar. La cuenta se puede cerrar cuando
              todos estén entregados (o anulados, si seguían pendientes).
            </p>
          }
          <div class="acciones">
            <a class="btn btn-secundario" routerLink="/pedidos/nuevo" [queryParams]="{ mesa: c.idmesa }">Agregar platos</a>
            <button class="btn" (click)="cerrar(c)" [disabled]="c.pedidosPorEntregar > 0 || cerrando()">
              {{ cerrando() ? 'Cerrando...' : 'Cerrar cuenta y liberar mesa' }}
            </button>
          </div>
        } @else {
          <p class="exito">Cuenta cerrada. La mesa {{ c.numeroMesa }} quedó libre.</p>
          <div class="acciones">
            <button class="btn" (click)="imprimir()">Imprimir cuenta</button>
          </div>
        }
      </div>
    }
  `,
})
export class CuentaComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cuentaService = inject(CuentaService);
  private pedidoService = inject(PedidoService);

  idmesa = 0;
  cuenta = signal<Cuenta | null>(null);
  sinConsumo = signal(false);
  cerrando = signal(false);
  error = signal('');
  private timer?: ReturnType<typeof setInterval>;

  etiqueta = etiquetaEstado;
  clase = claseEstado;

  ngOnInit(): void {
    this.idmesa = Number(this.route.snapshot.paramMap.get('idmesa'));
    this.cargar();
    this.timer = setInterval(() => {
      if (this.cuenta()?.estado === 'ABIERTA') this.cargar();
    }, 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  cargar(): void {
    this.cuentaService.abiertaDeMesa(this.idmesa).subscribe({
      next: (c) => {
        this.cuenta.set(c);
        this.sinConsumo.set(false);
      },
      error: (e: unknown) => {
        if (e instanceof HttpErrorResponse && e.status === 404) {
          this.cuenta.set(null);
          this.sinConsumo.set(true);
        } else {
          this.error.set(mensajeError(e));
        }
      },
    });
  }

  cerrar(c: Cuenta): void {
    if (!confirm(`¿Cerrar la cuenta de la mesa ${c.numeroMesa} por S/ ${c.total.toFixed(2)} y liberar la mesa?`)) {
      return;
    }
    this.error.set('');
    this.cerrando.set(true);
    this.cuentaService.cerrar(c.idcuenta).subscribe({
      next: (cerrada) => {
        this.cerrando.set(false);
        this.cuenta.set(cerrada);
      },
      error: (e: unknown) => {
        this.cerrando.set(false);
        this.error.set(mensajeError(e));
        this.cargar();
      },
    });
  }

  liberarSinConsumo(): void {
    this.error.set('');
    this.pedidoService.liberarMesa(this.idmesa).subscribe({
      next: () => this.router.navigate(['/mesas']),
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
  }

  imprimir(): void {
    window.print();
  }
}
