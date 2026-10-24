import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { PEDIDO_API } from '../core/api.config';
import { Cuenta } from '../models/cuenta.model';

@Injectable({ providedIn: 'root' })
export class CuentaService {
  private http = inject(HttpClient);

  abiertaDeMesa(idmesa: number): Observable<Cuenta> {
    return this.http.get<Cuenta>(`${PEDIDO_API}/cuentas/mesa/${idmesa}`);
  }

  obtener(id: number): Observable<Cuenta> {
    return this.http.get<Cuenta>(`${PEDIDO_API}/cuentas/${id}`);
  }

  cerrar(id: number): Observable<Cuenta> {
    return this.http.put<Cuenta>(`${PEDIDO_API}/cuentas/${id}/cerrar`, {});
  }
}
