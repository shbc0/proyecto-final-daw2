import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { mensajeError } from '../../core/error.util';
import { Mesa } from '../../models/mesa.model';
import { DetalleRequest, Pedido } from '../../models/pedido.model';
import { Plato } from '../../models/plato.model';
import { MesaService } from '../../services/mesa.service';
import { PedidoService } from '../../services/pedido.service';
import { PlatoService } from '../../services/plato.service';

interface Linea {
  idplato: number;
  nombre: string;
  categoria: string;
  precio: number;
  cantidad: number;
  observacion: string;
  notas: string[];
  noDisponible?: boolean;
}

interface Resumen {
  mesa: string;
  lineas: Linea[];
  total: number;
}

const normalizar = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

@Component({
  selector: 'app-pedido-form',
  imports: [FormsModule, RouterLink, DecimalPipe],
  template: `
    <div class="barra-titulo">
      <h2>{{ idpedido() === null ? 'Nuevo pedido' : 'Editar pedido #' + idpedido() }}</h2>
      <a class="btn btn-secundario" [routerLink]="volverA">Volver</a>
    </div>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    <div class="tarjeta">
      @if (idpedido() === null) {
        <label for="mesa">Mesa</label>
        @if (mesas().length === 0) {
          <p class="suave">No hay mesas ocupadas. Ocupa una desde la página Mesas.</p>
        } @else {
          <select id="mesa" [ngModel]="idmesa()" (ngModelChange)="idmesa.set($event)">
            <option [ngValue]="null">Elige una mesa ocupada</option>
            @for (m of mesas(); track m.idmesa) {
              <option [ngValue]="m.idmesa">Mesa {{ m.numero }}</option>
            }
          </select>
          <p class="suave">Si la mesa ya tiene pedidos, este llegará a cocina como adicional y se sumará a la misma cuenta.</p>
        }
      } @else {
        <p><strong>{{ mesaTexto() }}</strong></p>
      }
    </div>

    <div class="filtros-carta">
      <input type="search" placeholder="Buscar plato..." aria-label="Buscar plato"
             [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)" />
      <div class="pestanas" role="tablist">
        @for (cat of categorias(); track cat) {
          <button type="button" role="tab" class="pestana" [class.activa]="categoria() === cat"
                  [attr.aria-selected]="categoria() === cat" (click)="categoria.set(cat)">
            {{ cat === ELEGIDOS ? 'Elegidos (' + elegidos() + ')' : cat }}
          </button>
        }
      </div>
    </div>

    <div class="grid-platos">
      @for (l of visibles(); track l.idplato) {
        <div class="tarjeta plato" [class.plato-elegido]="l.cantidad > 0">
          <div class="plato-cabecera">
            <div>
              <strong>{{ l.nombre }}</strong>
              <div class="suave">{{ l.categoria }}</div>
            </div>
            <span class="plato-precio">S/ {{ l.precio | number: '1.2-2' }}</span>
          </div>

          <div class="contador" role="group" [attr.aria-label]="'Cantidad de ' + l.nombre">
            <button type="button" class="btn-contador" (click)="menos(l)" [disabled]="l.cantidad === 0"
                    aria-label="Quitar uno">−</button>
            <input type="number" min="0" inputmode="numeric" [(ngModel)]="l.cantidad" aria-label="Cantidad" />
            <button type="button" class="btn-contador" (click)="mas(l)" [disabled]="l.noDisponible"
                    aria-label="Agregar uno">+</button>
          </div>

          @if (l.cantidad > 0) {
            <input type="text" placeholder="Observación (ej: sin ají)" [(ngModel)]="l.observacion"
                   [attr.aria-label]="'Observación para ' + l.nombre" />
            @if (l.notas.length > 0) {
              <div class="chips">
                @for (nota of l.notas; track nota) {
                  <button type="button" class="chip" [class.chip-activo]="tieneNota(l, nota)"
                          (click)="alternarNota(l, nota)">{{ nota }}</button>
                }
              </div>
            }
          }
        </div>
      } @empty {
        <p class="suave">
          {{ lineas().length === 0 ? 'No hay platos disponibles.' : 'Ningún plato coincide con la búsqueda.' }}
        </p>
      }
    </div>

    <div class="barra-pedido">
      <span><strong>{{ unidades() }}</strong> plato(s) · <strong>S/ {{ total() | number: '1.2-2' }}</strong></span>
      <button class="btn" (click)="revisar()" [disabled]="guardando() || unidades() === 0">Revisar pedido</button>
    </div>

    @if (resumen(); as r) {
      <div class="fondo-modal">
        <div class="tarjeta modal" role="dialog" aria-labelledby="titulo-resumen">
          <h3 id="titulo-resumen">Confirma el pedido · {{ r.mesa }}</h3>
          <ul class="lista-resumen">
            @for (l of r.lineas; track l.idplato) {
              <li>
                <span><strong>{{ l.cantidad }} ×</strong> {{ l.nombre }}
                  @if (l.observacion.trim()) {
                    <em>({{ l.observacion.trim() }})</em>
                  }
                </span>
                <span>S/ {{ l.precio * l.cantidad | number: '1.2-2' }}</span>
              </li>
            }
          </ul>
          <p><strong>Total: S/ {{ r.total | number: '1.2-2' }}</strong></p>
          @if (error()) {
            <p class="error">{{ error() }}</p>
          }
          <div class="acciones">
            <button class="btn" (click)="enviar()" [disabled]="guardando()">
              {{ guardando() ? 'Enviando...' : (idpedido() === null ? 'Enviar a cocina' : 'Guardar cambios') }}
            </button>
            <button class="btn btn-secundario" (click)="resumen.set(null)" [disabled]="guardando()">Corregir</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class PedidoFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private platoService = inject(PlatoService);
  private mesaService = inject(MesaService);
  private pedidoService = inject(PedidoService);

  idpedido = signal<number | null>(null);
  idmesa = signal<number | null>(null);
  mesaTexto = signal('');
  mesas = signal<Mesa[]>([]);
  lineas = signal<Linea[]>([]);
  resumen = signal<Resumen | null>(null);
  error = signal('');
  guardando = signal(false);
  volverA = this.route.snapshot.queryParamMap.has('mesa') ? '/mesas' : '/pedidos';

  readonly TODAS = 'Todas';
  readonly ELEGIDOS = 'Elegidos';
  categoria = signal(this.TODAS);
  busqueda = signal('');
  categorias = computed(() => {
    const cats = this.lineas().map((l) => l.categoria).filter((c) => c !== '');
    return [this.TODAS, ...new Set(cats), this.ELEGIDOS];
  });

  visibles(): Linea[] {
    const cat = this.categoria();
    const texto = normalizar(this.busqueda().trim());
    return this.lineas().filter(
      (l) =>
        (cat === this.TODAS || (cat === this.ELEGIDOS ? l.cantidad > 0 : l.categoria === cat)) &&
        (texto === '' || normalizar(l.nombre).includes(texto)),
    );
  }

  elegidos(): number {
    return this.lineas().filter((l) => l.cantidad > 0).length;
  }

  unidades(): number {
    return this.lineas().reduce((suma, l) => suma + (l.cantidad || 0), 0);
  }

  menos(l: Linea): void {
    l.cantidad = Math.max(0, (l.cantidad || 0) - 1);
  }

  mas(l: Linea): void {
    l.cantidad = (l.cantidad || 0) + 1;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarEdicion(Number(id));
    } else {
      this.cargarNuevo();
    }
  }

  total(): number {
    return this.lineas().reduce((suma, l) => suma + l.precio * (l.cantidad || 0), 0);
  }

  tieneNota(l: Linea, nota: string): boolean {
    return this.partesDe(l.observacion).includes(nota);
  }

  alternarNota(l: Linea, nota: string): void {
    const partes = this.partesDe(l.observacion);
    l.observacion = (partes.includes(nota) ? partes.filter((p) => p !== nota) : [...partes, nota]).join(', ');
  }

  revisar(): void {
    this.error.set('');
    const elegidas = this.lineas().filter((l) => l.cantidad > 0);
    if (elegidas.length === 0) {
      this.error.set('Elige al menos un plato con cantidad mayor a 0.');
      return;
    }
    let mesa = this.mesaTexto();
    if (this.idpedido() === null) {
      const elegida = this.mesas().find((m) => m.idmesa === this.idmesa());
      if (!elegida) {
        this.error.set('Elige la mesa del pedido.');
        return;
      }
      mesa = `Mesa ${elegida.numero}`;
    }
    this.resumen.set({ mesa, lineas: elegidas, total: this.total() });
  }

  enviar(): void {
    const r = this.resumen();
    if (!r) return;
    this.error.set('');
    const detalles: DetalleRequest[] = r.lineas.map((l) => ({
      idplato: l.idplato,
      cantidad: l.cantidad,
      observacion: l.observacion.trim() || undefined,
    }));

    const id = this.idpedido();
    const peticion =
      id === null
        ? this.pedidoService.crear({ idmesa: this.idmesa()!, detalles })
        : this.pedidoService.actualizar(id, { detalles });

    this.guardando.set(true);
    peticion.subscribe({
      next: () => this.router.navigate(['/pedidos']),
      error: (e: unknown) => {
        this.guardando.set(false);
        this.error.set(mensajeError(e));
      },
    });
  }

  private partesDe(observacion: string): string[] {
    return observacion.split(',').map((p) => p.trim()).filter((p) => p !== '');
  }

  private cargarNuevo(): void {
    forkJoin({
      platos: this.platoService.listar(true),
      mesas: this.mesaService.listar('OCUPADA'),
    }).subscribe({
      next: ({ platos, mesas }) => {
        this.mesas.set(mesas);
        this.lineas.set(platos.map((p) => this.linea(p)));
        const mesaParam = Number(this.route.snapshot.queryParamMap.get('mesa'));
        if (mesaParam && mesas.some((m) => m.idmesa === mesaParam)) {
          this.idmesa.set(mesaParam);
        }
      },
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
  }

  private cargarEdicion(id: number): void {
    this.idpedido.set(id);
    forkJoin({
      platos: this.platoService.listar(true),
      pedido: this.pedidoService.obtener(id),
    }).subscribe({
      next: ({ platos, pedido }) => {
        this.idmesa.set(pedido.idmesa);
        this.mesaTexto.set(`Mesa ${pedido.numeroMesa}`);
        this.lineas.set(this.lineasDeEdicion(platos, pedido));
      },
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
  }

  private lineasDeEdicion(platos: Plato[], pedido: Pedido): Linea[] {
    const lineas = platos.map((p) => {
      const detalle = pedido.detalles.find((d) => d.idplato === p.idplato);
      return this.linea(p, detalle?.cantidad, detalle?.observacion);
    });
    pedido.detalles
      .filter((d) => !platos.some((p) => p.idplato === d.idplato))
      .forEach((d) =>
        lineas.unshift({
          idplato: d.idplato,
          nombre: `${d.nombrePlato} (agotado, pedía ${d.cantidad})`,
          categoria: '',
          precio: d.precioUnitario,
          cantidad: 0,
          observacion: d.observacion ?? '',
          notas: [],
          noDisponible: true,
        }),
      );
    return lineas;
  }

  private linea(p: Plato, cantidad = 0, observacion: string | null = null): Linea {
    return {
      idplato: p.idplato,
      nombre: p.nombre,
      categoria: p.categoria ?? '',
      precio: p.precio,
      cantidad,
      observacion: observacion ?? '',
      notas: p.notas ?? [],
    };
  }
}
