import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CARTA_API } from '../core/api.config';
import { Plato, PlatoPayload } from '../models/plato.model';

@Injectable({ providedIn: 'root' })
export class PlatoService {
  private http = inject(HttpClient);

  listar(soloDisponibles = false): Observable<Plato[]> {
    const params = soloDisponibles ? new HttpParams().set('disponibles', 'true') : undefined;
    return this.http.get<Plato[]>(`${CARTA_API}/platos`, { params });
  }

  crear(plato: PlatoPayload): Observable<Plato> {
    return this.http.post<Plato>(`${CARTA_API}/platos`, plato);
  }

  actualizar(id: number, plato: PlatoPayload): Observable<Plato> {
    return this.http.put<Plato>(`${CARTA_API}/platos/${id}`, plato);
  }

  cambiarDisponibilidad(id: number, disponible: boolean): Observable<Plato> {
    return this.http.put<Plato>(`${CARTA_API}/platos/${id}/disponibilidad`, { disponible });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${CARTA_API}/platos/${id}`);
  }
}
