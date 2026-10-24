import { Pedido } from './pedido.model';

export type EstadoCuenta = 'ABIERTA' | 'CERRADA';

export interface CuentaItem {
  idplato: number;
  nombrePlato: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export interface Cuenta {
  idcuenta: number;
  idmesa: number;
  numeroMesa: number;
  comensales: number | null;
  estado: EstadoCuenta;
  fechaApertura: string;
  fechaCierre: string | null;
  mozoCierre: string | null;
  items: CuentaItem[];
  total: number;
  pedidosPorEntregar: number;
  pedidos: Pedido[];
}
