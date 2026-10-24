import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/error.util';
import { Plato } from '../../models/plato.model';
import { PlatoService } from '../../services/plato.service';

const MAX_NOTAS = 10;

const SUGERENCIAS_POR_CATEGORIA: Record<string, string[]> = {
  Entradas: ['Sin ají', 'Sin cebolla', 'Poca sal'],
  Fondos: ['Sin ají', 'Sin cebolla', 'Poca sal', 'Término medio', 'Bien cocido'],
  Postres: ['Para compartir'],
  Bebidas: ['Sin hielo', 'Sin azúcar', 'Helada'],
};
const SUGERENCIAS_GENERALES = ['Sin ají', 'Sin cebolla', 'Poca sal'];

@Component({
  selector: 'app-platos',
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="barra-titulo">
      <h2>Carta de platos</h2>
      @if (auth.esAdmin() && !mostrarForm()) {
        <button class="btn" (click)="nuevo()">Nuevo plato</button>
      }
    </div>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @if (mostrarForm()) {
      <form class="tarjeta formulario" [formGroup]="form" (ngSubmit)="guardar()">
        <h3>{{ editando() ? 'Editar plato' : 'Nuevo plato' }}</h3>

        <label for="nombre">Nombre</label>
        <input id="nombre" formControlName="nombre" />

        <label for="descripcion">Descripción</label>
        <input id="descripcion" formControlName="descripcion" />

        <label for="categoria">Categoría</label>
        <input id="categoria" formControlName="categoria" placeholder="Entradas, Fondos, Postres, Bebidas" />

        <label for="precio">Precio (S/)</label>
        <input id="precio" type="number" step="0.01" min="0" formControlName="precio" />

        <label class="inline"><input type="checkbox" formControlName="disponible" /> Disponible</label>

        <label for="nueva-nota">Observaciones rápidas</label>
        <p class="suave">El mozo las marca con un toque al tomar el pedido. También puede escribir una observación libre.</p>
        <div class="chips">
          @for (nota of notas(); track nota) {
            <span class="chip chip-activo">
              {{ nota }}
              <button type="button" class="chip-quitar" (click)="quitarNota(nota)" [attr.aria-label]="'Quitar ' + nota">✕</button>
            </span>
          } @empty {
            <span class="suave">Sin observaciones.</span>
          }
        </div>
        <div class="fila-nota">
          <input #nuevaNota id="nueva-nota" maxlength="50" placeholder="Ej: Sin ají"
                 (keydown.enter)="$event.preventDefault(); agregarNota(nuevaNota)" />
          <button type="button" class="btn btn-secundario" (click)="agregarNota(nuevaNota)">Agregar</button>
        </div>
        @if (sugerencias().length > 0) {
          <p class="suave">Sugerencias:</p>
          <div class="chips">
            @for (s of sugerencias(); track s) {
              <button type="button" class="chip" (click)="agregarTexto(s)">+ {{ s }}</button>
            }
          </div>
        }

        <div class="acciones">
          <button class="btn" type="submit" [disabled]="form.invalid">Guardar</button>
          <button class="btn btn-secundario" type="button" (click)="cancelar()">Cancelar</button>
        </div>
      </form>
    }

    <div class="tarjeta">
      <table class="tabla-responsiva">
        <thead>
          <tr>
            <th>Plato</th><th>Categoría</th><th>Precio</th><th>Estado</th><th></th>
          </tr>
        </thead>
        <tbody>
          @for (p of platos(); track p.idplato) {
            <tr>
              <td data-label="Plato">
                <strong>{{ p.nombre }}</strong>
                @if (p.descripcion) {
                  <div class="suave">{{ p.descripcion }}</div>
                }
                @if (p.notas.length > 0) {
                  <div class="suave">Observaciones: {{ p.notas.join(', ') }}</div>
                }
              </td>
              <td data-label="Categoría">{{ p.categoria }}</td>
              <td data-label="Precio">S/ {{ p.precio | number: '1.2-2' }}</td>
              <td data-label="Estado">
                <span class="pill" [class.pill-ok]="p.disponible" [class.pill-mal]="!p.disponible">
                  {{ p.disponible ? 'Disponible' : 'Agotado' }}
                </span>
              </td>
              <td class="celda-acciones">
                <div class="acciones">
                  <button class="btn btn-peq" (click)="cambiarDisponibilidad(p)">
                    {{ p.disponible ? 'Marcar agotado' : 'Marcar disponible' }}
                  </button>
                  @if (auth.esAdmin()) {
                    <button class="btn btn-peq btn-secundario" (click)="editar(p)">Editar</button>
                    <button class="btn btn-peq btn-peligro" (click)="eliminar(p)">Eliminar</button>
                  }
                </div>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="5">No hay platos registrados.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .chip-quitar { background: none; border: 0; color: inherit; cursor: pointer; margin-left: .3rem; padding: 0; }
    .fila-nota { display: flex; gap: .5rem; margin-top: .5rem; }
    .fila-nota .btn { white-space: nowrap; }
  `,
})
export class PlatosComponent implements OnInit {
  auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private platoService = inject(PlatoService);

  platos = signal<Plato[]>([]);
  editando = signal<Plato | null>(null);
  mostrarForm = signal(false);
  error = signal('');
  notas = signal<string[]>([]);

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    categoria: [''],
    precio: [0, [Validators.required, Validators.min(0.01)]],
    disponible: [true],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.platoService.listar().subscribe({
      next: (r) => this.platos.set(r),
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
  }

  nuevo(): void {
    this.editando.set(null);
    this.form.reset({ nombre: '', descripcion: '', categoria: '', precio: 0, disponible: true });
    this.notas.set([]);
    this.mostrarForm.set(true);
  }

  editar(p: Plato): void {
    this.editando.set(p);
    this.form.reset({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      categoria: p.categoria ?? '',
      precio: p.precio,
      disponible: p.disponible,
    });
    this.notas.set([...(p.notas ?? [])]);
    this.mostrarForm.set(true);
  }

  sugerencias(): string[] {
    const lista = SUGERENCIAS_POR_CATEGORIA[this.form.controls.categoria.value.trim()] ?? SUGERENCIAS_GENERALES;
    return lista.filter((s) => !this.tieneNota(s));
  }

  agregarNota(input: HTMLInputElement): void {
    if (this.agregarTexto(input.value)) {
      input.value = '';
    }
  }

  agregarTexto(texto: string): boolean {
    const nota = texto.trim();
    if (!nota) return false;
    if (nota.includes(',')) {
      this.error.set('Una observación no puede llevar comas.');
      return false;
    }
    if (this.tieneNota(nota)) return true;
    if (this.notas().length >= MAX_NOTAS) {
      this.error.set(`Un plato puede tener hasta ${MAX_NOTAS} observaciones.`);
      return false;
    }
    this.error.set('');
    this.notas.update((lista) => [...lista, nota]);
    return true;
  }

  quitarNota(nota: string): void {
    this.notas.update((lista) => lista.filter((n) => n !== nota));
  }

  private tieneNota(nota: string): boolean {
    return this.notas().some((n) => n.toLowerCase() === nota.toLowerCase());
  }

  cancelar(): void {
    this.mostrarForm.set(false);
    this.editando.set(null);
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.error.set('');
    const datos = { ...this.form.getRawValue(), notas: this.notas() };
    const actual = this.editando();
    const peticion = actual
      ? this.platoService.actualizar(actual.idplato, datos)
      : this.platoService.crear(datos);
    peticion.subscribe({
      next: () => {
        this.cancelar();
        this.cargar();
      },
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
  }

  cambiarDisponibilidad(p: Plato): void {
    this.error.set('');
    this.platoService.cambiarDisponibilidad(p.idplato, !p.disponible).subscribe({
      next: () => this.cargar(),
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
  }

  eliminar(p: Plato): void {
    if (!confirm(`¿Eliminar el plato "${p.nombre}"?`)) return;
    this.error.set('');
    this.platoService.eliminar(p.idplato).subscribe({
      next: () => this.cargar(),
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
  }
}
