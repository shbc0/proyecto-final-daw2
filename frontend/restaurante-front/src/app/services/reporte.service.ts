import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { PEDIDO_API } from '../core/api.config';
import { Reporte } from '../models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private http = inject(HttpClient);

  resumen(desde: string, hasta: string): Observable<Reporte> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<Reporte>(`${PEDIDO_API}/reportes/resumen`, { params });
  }
}
