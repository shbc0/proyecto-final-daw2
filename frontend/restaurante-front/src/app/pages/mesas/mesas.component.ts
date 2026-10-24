import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/error.util';
import { duracionTexto } from '../../core/tiempo.util';
import { Mesa } from '../../models/mesa.model';
import { Pedido } from '../../models/pedido.model';
import { MesaService } from '../../services/mesa.service';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-mesas',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="barra-titulo">
      <h2>Mesas del salón</h2>
      @if (auth.esAdmin() && !mostrarForm()) {
        <button class="btn" (click)="nueva()">Nueva mesa</button>
      }
    </div>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    <div class="resumen-salon">
      <span class="pill pill-ok">{{ libres() }} libres</span>
      <span class="pill pill-warn">{{ mesas().length - libres() }} ocupadas</span>
      @if (puedeAtender()) {
        <span class="pill" [class.pill-ok]="totalListos() > 0" [class.pill-gris]="totalListos() === 0">
          {{ totalListos() }} pedido(s) listo(s) para entregar
        </span>
      }
    </div>

    @if (mostrarForm()) {
      <form class="tarjeta formulario" [formGroup]="form" (ngSubmit)="guardar()">
        <h3>{{ editando() ? 'Editar mesa' : 'Nueva mesa' }}</h3>

        <label for="numero">Número de mesa</label>
        <input id="numero" type="number" min="1" formControlName="numero" />

        <label for="capacidad">Capacidad (personas)</label>
        <input id="capacidad" type="number" min="1" formControlName="capacidad" />

        <div class="acciones">
          <button class="btn" type="submit" [disabled]="form.invalid">Guardar</button>
          <button class="btn btn-secundario" type="button" (click)="cancelar()">Cancelar</button>
        </div>
      </form>
    }

    <div class="grid-mesas">
      @for (m of mesas(); track m.idmesa) {
        <div class="tarjeta mesa" [class.mesa-libre]="m.estado === 'LIBRE'" [class.mesa-ocupada]="m.estado === 'OCUPADA'"
             [class.mesa-lista]="listosDe(m) > 0">
          <div class="fila">
            <p class="mesa-num">Mesa {{ m.numero }}</p>
            <span class="pill" [class.pill-ok]="m.estado === 'LIBRE'" [class.pill-warn]="m.estado === 'OCUPADA'">
              {{ m.estado === 'LIBRE' ? 'Libre' : 'Ocupada' }}
            </span>
          </div>
          @if (m.estado === 'OCUPADA') {
            <p class="suave">{{ m.comensales ?? '?' }}/{{ m.capacidad }} personas</p>
            @if (m.fechaOcupacion) {
              <p class="suave">Ocupada hace {{ duracion(m.fechaOcupacion) }}</p>
            }
            <div class="indicadores">
              @if (listosDe(m) > 0) {
                <a class="pill pill-listo parpadeo" routerLink="/pedidos" [queryParams]="{ mesa: m.idmesa }">
                  {{ listosDe(m) }} listo(s) · entregar
                </a>
              }
              @if (enCocinaDe(m) > 0) {
                <span class="pill pill-info">{{ enCocinaDe(m) }} en cocina</span>
              }
              @if (listosDe(m) === 0 && enCocinaDe(m) === 0) {
                <span class="pill pill-gris">Sin pedidos en curso</span>
              }
            </div>
          } @else {
            <p class="suave">{{ m.capacidad }} personas</p>
          }

          @if (puedeAtender()) {
            @if (m.estado === 'LIBRE') {
              @if (ocupandoId() === m.idmesa) {
                <label [for]="'comensales-' + m.idmesa">Comensales</label>
                <input #comensales [id]="'comensales-' + m.idmesa" type="number" min="1"
                       [max]="m.capacidad" [value]="m.capacidad" />
                <div class="acciones">
                  <button class="btn btn-peq" (click)="ocupar(m, comensales.valueAsNumber)">Confirmar</button>
                  <button class="btn btn-peq btn-secundario" (click)="ocupandoId.set(null)">Cancelar</button>
                </div>
              } @else {
                <div class="acciones">
                  <button class="btn btn-peq" (click)="ocupandoId.set(m.idmesa)">Ocupar</button>
                </div>
              }
            } @else {
              <div class="acciones">
                <a class="btn btn-peq" routerLink="/pedidos/nuevo" [queryParams]="{ mesa: m.idmesa }">Tomar pedido</a>
                <a class="btn btn-peq btn-secundario" [routerLink]="['/mesas', m.idmesa, 'cuenta']">Cuenta</a>
              </div>
            }
          }

          @if (auth.esAdmin()) {
            <div class="acciones">
              <button class="btn btn-peq btn-secundario" (click)="editar(m)">Editar</button>
              @if (m.estado === 'LIBRE') {
                <button class="btn btn-peq btn-peligro" (click)="eliminar(m)">Eliminar</button>
              }
            </div>
          }
        </div>
      } @empty {
        <p class="suave">No hay mesas registradas.</p>
      }
    </div>
  `,
})
export class MesasComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private mesaService = inject(MesaService);
  private pedidoService = inject(PedidoService);

  mesas = signal<Mesa[]>([]);
  activos = signal<Pedido[]>([]);
  libres = computed(() => this.mesas().filter((m) => m.estado === 'LIBRE').length);
  totalListos = computed(() => this.activos().filter((p) => p.estado === 'LISTO').length);
  duracion = duracionTexto;
  editando = signal<Mesa | null>(null);
  mostrarForm = signal(false);
  ocupandoId = signal<number | null>(null);
  error = signal('');
  private timer?: ReturnType<typeof setInterval>;

  form = this.fb.nonNullable.group({
    numero: [1, [Validators.required, Validators.min(1)]],
    capacidad: [2, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.cargar();
    this.timer = setInterval(() => this.cargar(), 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  puedeAtender(): boolean {
    return this.auth.tieneRol('MOZO') || this.auth.esAdmin();
  }

  cargar(): void {
    this.mesaService.listar().subscribe({
      next: (r) => this.mesas.set(r),
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
    if (this.puedeAtender()) {
      this.pedidoService.listar(['PENDIENTE', 'EN_PREPARACION', 'LISTO']).subscribe({
        next: (r) => this.activos.set(r),
        error: (e: unknown) => this.error.set(mensajeError(e)),
      });
    }
  }

  listosDe(m: Mesa): number {
    return this.activos().filter((p) => p.idmesa === m.idmesa && p.estado === 'LISTO').length;
  }

  enCocinaDe(m: Mesa): number {
    return this.activos().filter((p) => p.idmesa === m.idmesa && p.estado !== 'LISTO').length;
  }

  nueva(): void {
    this.editando.set(null);
    this.form.reset({ numero: this.mesas().length + 1, capacidad: 2 });
    this.mostrarForm.set(true);
  }

  editar(m: Mesa): void {
    this.editando.set(m);
    this.form.reset({ numero: m.numero, capacidad: m.capacidad });
    this.mostrarForm.set(true);
  }

  cancelar(): void {
    this.mostrarForm.set(false);
    this.editando.set(null);
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.error.set('');
    const datos = this.form.getRawValue();
    const actual = this.editando();
    const peticion = actual
      ? this.mesaService.actualizar(actual.idmesa, datos)
      : this.mesaService.crear(datos);
    peticion.subscribe({
      next: () => {
        this.cancelar();
        this.cargar();
      },
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
  }

  ocupar(m: Mesa, comensales: number): void {
    this.error.set('');
    if (!comensales || comensales < 1 || comensales > m.capacidad) {
      this.error.set(`La mesa ${m.numero} admite de 1 a ${m.capacidad} comensales.`);
      return;
    }
    this.mesaService.ocupar(m.idmesa, comensales).subscribe({
      next: () => {
        this.ocupandoId.set(null);
        this.cargar();
      },
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
  }

  eliminar(m: Mesa): void {
    if (!confirm(`¿Eliminar la mesa ${m.numero}?`)) return;
    this.error.set('');
    this.mesaService.eliminar(m.idmesa).subscribe({
      next: () => this.cargar(),
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
  }
}
