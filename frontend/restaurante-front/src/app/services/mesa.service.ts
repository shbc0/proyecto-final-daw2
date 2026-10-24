import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { MESA_API } from '../core/api.config';
import { EstadoMesa, Mesa, MesaPayload } from '../models/mesa.model';

@Injectable({ providedIn: 'root' })
export class MesaService {
  private http = inject(HttpClient);

  listar(estado?: EstadoMesa): Observable<Mesa[]> {
    const params = estado ? new HttpParams().set('estado', estado) : undefined;
    return this.http.get<Mesa[]>(`${MESA_API}/mesas`, { params });
  }

  crear(mesa: MesaPayload): Observable<Mesa> {
    return this.http.post<Mesa>(`${MESA_API}/mesas`, mesa);
  }

  actualizar(id: number, mesa: MesaPayload): Observable<Mesa> {
    return this.http.put<Mesa>(`${MESA_API}/mesas/${id}`, mesa);
  }

  ocupar(id: number, comensales: number): Observable<Mesa> {
    return this.http.put<Mesa>(`${MESA_API}/mesas/${id}/ocupar`, { comensales });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${MESA_API}/mesas/${id}`);
  }
}
