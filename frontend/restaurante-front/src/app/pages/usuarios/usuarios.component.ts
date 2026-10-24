import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { mensajeError } from '../../core/error.util';
import { Rol, Usuario } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule],
  template: `
    <div class="barra-titulo">
      <h2>Cuentas del personal</h2>
      @if (!mostrarForm()) {
        <button class="btn" (click)="nuevo()">Nuevo usuario</button>
      }
    </div>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @if (mostrarForm()) {
      <form class="tarjeta formulario" [formGroup]="form" (ngSubmit)="guardar()">
        <h3>{{ editando() ? 'Editar usuario' : 'Nuevo usuario' }}</h3>

        <label for="nomusuario">Usuario</label>
        <input id="nomusuario" formControlName="nomusuario" autocomplete="off" />

        <label for="email">Correo</label>
        <input id="email" type="email" formControlName="email" />

        <label for="nombres">Nombres</label>
        <input id="nombres" formControlName="nombres" />

        <label for="apellidos">Apellidos</label>
        <input id="apellidos" formControlName="apellidos" />

        <label for="password">{{ editando() ? 'Nueva contraseña (opcional)' : 'Contraseña' }}</label>
        <input id="password" type="password" formControlName="password" autocomplete="new-password" />

        <label for="idrol">Rol</label>
        <select id="idrol" formControlName="idrol">
          <option [ngValue]="0">Elige un rol</option>
          @for (r of roles(); track r.idrol) {
            <option [ngValue]="r.idrol">{{ r.nomrol }}</option>
          }
        </select>

        <label class="inline"><input type="checkbox" formControlName="activo" /> Cuenta activa</label>

        <div class="acciones">
          <button class="btn" type="submit" [disabled]="form.invalid">Guardar</button>
          <button class="btn btn-secundario" type="button" (click)="cancelar()">Cancelar</button>
        </div>
      </form>
    }

    <div class="tarjeta">
      <table class="tabla-responsiva">
        <thead>
          <tr><th>Usuario</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th></th></tr>
        </thead>
        <tbody>
          @for (u of usuarios(); track u.idusuario) {
            <tr>
              <td data-label="Usuario"><strong>{{ u.nomusuario }}</strong></td>
              <td data-label="Nombre">{{ u.nombres }} {{ u.apellidos }}</td>
              <td data-label="Correo">{{ u.email }}</td>
              <td data-label="Rol">{{ u.roles.join(', ') }}</td>
              <td data-label="Estado">
                <span class="pill" [class.pill-ok]="u.activo" [class.pill-gris]="!u.activo">
                  {{ u.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="celda-acciones">
                <div class="acciones">
                  <button class="btn btn-peq btn-secundario" (click)="editar(u)">Editar</button>
                  <button class="btn btn-peq btn-peligro" (click)="eliminar(u)">Eliminar</button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="6">No hay usuarios.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class UsuariosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);

  usuarios = signal<Usuario[]>([]);
  roles = signal<Rol[]>([]);
  editando = signal<Usuario | null>(null);
  mostrarForm = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group({
    nomusuario: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    nombres: [''],
    apellidos: [''],
    password: [''],
    idrol: [0, Validators.min(1)],
    activo: [true],
  });

  ngOnInit(): void {
    this.cargar();
    this.usuarioService.roles().subscribe({
      next: (r) => this.roles.set(r),
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
  }

  cargar(): void {
    this.usuarioService.listar().subscribe({
      next: (r) => this.usuarios.set(r),
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
  }

  nuevo(): void {
    this.editando.set(null);
    this.form.controls.nomusuario.enable();
    this.form.reset({ nomusuario: '', email: '', nombres: '', apellidos: '', password: '', idrol: 0, activo: true });
    this.mostrarForm.set(true);
  }

  editar(u: Usuario): void {
    this.editando.set(u);
    const rol = this.roles().find((r) => u.roles.includes(r.nomrol));
    this.form.reset({
      nomusuario: u.nomusuario,
      email: u.email,
      nombres: u.nombres ?? '',
      apellidos: u.apellidos ?? '',
      password: '',
      idrol: rol?.idrol ?? 0,
      activo: u.activo,
    });
    this.form.controls.nomusuario.disable();
    this.mostrarForm.set(true);
  }

  cancelar(): void {
    this.mostrarForm.set(false);
    this.editando.set(null);
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.error.set('');
    const v = this.form.getRawValue();
    const actual = this.editando();
    if (!actual && !v.password) {
      this.error.set('La contraseña es obligatoria para un usuario nuevo.');
      return;
    }
    const payload = {
      nomusuario: v.nomusuario,
      email: v.email,
      password: v.password,
      nombres: v.nombres,
      apellidos: v.apellidos,
      activo: v.activo,
      rolesIds: [v.idrol],
    };
    const peticion = actual
      ? this.usuarioService.actualizar(actual.idusuario, payload)
      : this.usuarioService.crear(payload);
    peticion.subscribe({
      next: () => {
        this.cancelar();
        this.cargar();
      },
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
  }

  eliminar(u: Usuario): void {
    if (!confirm(`¿Eliminar al usuario "${u.nomusuario}"?`)) return;
    this.error.set('');
    this.usuarioService.eliminar(u.idusuario).subscribe({
      next: () => this.cargar(),
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
  }
}
