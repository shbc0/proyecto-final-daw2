import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';

import { AUTH_API } from './api.config';
import { GenericResponse, UsuarioSesion } from '../models/auth.model';

const CLAVE_SESION = 'restaurante_sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _sesion = signal<UsuarioSesion | null>(this.leerSesion());
  readonly sesion = this._sesion.asReadonly();

  login(username: string, password: string): Observable<UsuarioSesion> {
    return this.http
      .post<GenericResponse<UsuarioSesion>>(`${AUTH_API}/auth/login`, { username, password })
      .pipe(
        map((r) => {
          if (!r.response) {
            throw new Error(r.error?.message ?? 'No se pudo iniciar sesion');
          }
          return r.response;
        }),
        tap((sesion) => this.guardarSesion(sesion)),
      );
  }

  logout(): void {
    this.limpiarSesion();
    this.router.navigate(['/login']);
  }

  limpiarSesion(): void {
    localStorage.removeItem(CLAVE_SESION);
    this._sesion.set(null);
  }

  token(): string | null {
    return this._sesion()?.token ?? null;
  }

  sesionValida(): boolean {
    const s = this._sesion();
    return !!s && !this.tokenExpirado(s.token);
  }

  tieneRol(rol: string): boolean {
    return this._sesion()?.roles.includes('ROLE_' + rol) ?? false;
  }

  esAdmin(): boolean {
    return this.tieneRol('ADMIN');
  }

  rolesTexto(): string {
    return (this._sesion()?.roles ?? []).map((r) => r.replace('ROLE_', '')).join(', ');
  }

  rutaInicio(): string {
    if (this.tieneRol('ADMIN')) return '/platos';
    if (this.tieneRol('MOZO')) return '/mesas';
    if (this.tieneRol('COCINA')) return '/cocina';
    return '/login';
  }

  private guardarSesion(sesion: UsuarioSesion): void {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    this._sesion.set(sesion);
  }

  private leerSesion(): UsuarioSesion | null {
    try {
      const raw = localStorage.getItem(CLAVE_SESION);
      return raw ? (JSON.parse(raw) as UsuarioSesion) : null;
    } catch {
      return null;
    }
  }

  private tokenExpirado(token: string): boolean {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}
