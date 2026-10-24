import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="fondo">
      <form class="tarjeta caja" [formGroup]="form" (ngSubmit)="ingresar()">
        <h1>🍽️ Restaurante</h1>
        <p class="sub">Inicia sesión para continuar</p>

        <label for="username">Usuario</label>
        <input id="username" formControlName="username" autocomplete="username" />

        <label for="password">Contraseña</label>
        <input id="password" type="password" formControlName="password"
               autocomplete="current-password" />

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        <button class="btn" type="submit" [disabled]="form.invalid || cargando()">
          {{ cargando() ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>
    </div>
  `,
  styles: `
    .fondo { min-height: 100vh; display: grid; place-items: center; padding: 1rem; }
    .caja { width: 100%; max-width: 380px; }
    .sub { color: #666; margin-top: 0; }
    .btn { width: 100%; margin-top: 1rem; }
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  cargando = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  constructor() {
    if (this.auth.sesionValida() && this.auth.rutaInicio() !== '/login') {
      this.router.navigate([this.auth.rutaInicio()]);
    }
  }

  ingresar(): void {
    if (this.form.invalid) return;

    this.cargando.set(true);
    this.error.set('');
    const { username, password } = this.form.getRawValue();

    this.auth.login(username, password).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate([this.auth.rutaInicio()]);
      },
      error: (err: unknown) => {
        this.cargando.set(false);
        this.error.set(this.mensajeDeError(err));
      },
    });
  }

  private mensajeDeError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'No se pudo conectar con el servidor. ¿Está encendido el backend?';
      }
      return err.error?.error?.message ?? 'Usuario y/o contraseña incorrectos';
    }
    return err instanceof Error ? err.message : 'Error inesperado';
  }
}
