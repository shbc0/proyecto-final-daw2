import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AUTH_API } from '../core/api.config';
import { Rol, Usuario, UsuarioPayload } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${AUTH_API}/usuarios`);
  }

  roles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${AUTH_API}/roles`);
  }

  crear(usuario: UsuarioPayload): Observable<Usuario> {
    return this.http.post<Usuario>(`${AUTH_API}/usuarios`, usuario);
  }

  actualizar(id: number, usuario: UsuarioPayload): Observable<Usuario> {
    return this.http.put<Usuario>(`${AUTH_API}/usuarios/${id}`, usuario);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${AUTH_API}/usuarios/${id}`);
  }
}
