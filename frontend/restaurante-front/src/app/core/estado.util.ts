import { EstadoPedido } from '../models/pedido.model';

const ETIQUETAS: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  ANULADO: 'Anulado',
};

const CLASES: Record<EstadoPedido, string> = {
  PENDIENTE: 'pill pill-warn',
  EN_PREPARACION: 'pill pill-info',
  LISTO: 'pill pill-ok',
  ENTREGADO: 'pill pill-gris',
  ANULADO: 'pill pill-mal',
};

export const etiquetaEstado = (e: EstadoPedido): string => ETIQUETAS[e];
export const claseEstado = (e: EstadoPedido): string => CLASES[e];
