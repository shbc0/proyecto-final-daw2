export type EstadoPedido = 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO' | 'ANULADO';

export interface DetallePedido {
  iddetalle: number;
  idplato: number;
  nombrePlato: string;
  precioUnitario: number;
  cantidad: number;
  observacion: string | null;
  subtotal: number;
  agotado: boolean;
}

export interface Pedido {
  idpedido: number;
  idmesa: number;
  numeroMesa: number;
  idcuenta: number | null;
  adicional: boolean;
  mozo: string;
  mozoEntrega: string | null;
  estado: EstadoPedido;
  fechaRegistro: string;
  fechaPreparacion: string | null;
  fechaListo: string | null;
  fechaEntrega: string | null;
  fechaAnulacion: string | null;
  total: number;
  detalles: DetallePedido[];
}

export interface DetalleRequest {
  idplato: number;
  cantidad: number;
  observacion?: string;
}

export interface PedidoRequest {
  idmesa?: number;
  detalles: DetalleRequest[];
}
