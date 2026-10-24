import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { PEDIDO_API } from '../core/api.config';
import { Mesa } from '../models/mesa.model';
import { EstadoPedido, Pedido, PedidoRequest } from '../models/pedido.model';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private http = inject(HttpClient);

  listar(estados?: EstadoPedido[], idmesa?: number): Observable<Pedido[]> {
    let params = new HttpParams();
    if (estados && estados.length > 0) {
      params = params.set('estados', estados.join(','));
    }
    if (idmesa !== undefined) {
      params = params.set('idmesa', idmesa);
    }
    return this.http.get<Pedido[]>(`${PEDIDO_API}/pedidos`, { params });
  }

  obtener(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${PEDIDO_API}/pedidos/${id}`);
  }

  crear(pedido: PedidoRequest): Observable<Pedido> {
    return this.http.post<Pedido>(`${PEDIDO_API}/pedidos`, pedido);
  }

  actualizar(id: number, pedido: PedidoRequest): Observable<Pedido> {
    return this.http.put<Pedido>(`${PEDIDO_API}/pedidos/${id}`, pedido);
  }

  cambiarEstado(id: number, estado: EstadoPedido): Observable<Pedido> {
    return this.http.put<Pedido>(`${PEDIDO_API}/pedidos/${id}/estado`, { estado });
  }

  marcarAgotado(id: number, iddetalle: number): Observable<Pedido> {
    return this.http.put<Pedido>(`${PEDIDO_API}/pedidos/${id}/detalles/${iddetalle}/agotado`, {});
  }

  liberarMesa(idmesa: number): Observable<Mesa> {
    return this.http.put<Mesa>(`${PEDIDO_API}/pedidos/mesa/${idmesa}/liberar`, {});
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${PEDIDO_API}/pedidos/${id}`);
  }
}
