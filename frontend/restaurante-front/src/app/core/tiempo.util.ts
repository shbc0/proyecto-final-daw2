import { Pedido } from '../models/pedido.model';

export function minutosDesde(fecha: string | null | undefined): number {
  if (!fecha) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / 60000));
}

export function haceTexto(fecha: string | null | undefined): string {
  const min = minutosDesde(fecha);
  return min < 1 ? 'hace menos de 1 min' : `hace ${min} min`;
}

export function duracionTexto(fecha: string | null | undefined): string {
  const min = minutosDesde(fecha);
  if (min < 1) return 'menos de 1 min';
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
}

export type Semaforo = 'verde' | 'ambar' | 'rojo';

export const LIMITES = {
  PENDIENTE: [5, 10],
  EN_PREPARACION: [15, 25],
  LISTO: [2, 5],
} as const;

export interface TiempoPedido {
  minutos: number;
  color: Semaforo;
  texto: string;
}

export function tiempoPedido(p: Pedido): TiempoPedido {
  let desde = p.fechaRegistro;
  let texto = 'esperando';
  if (p.estado === 'EN_PREPARACION') {
    desde = p.fechaPreparacion ?? p.fechaRegistro;
    texto = 'en preparación';
  } else if (p.estado === 'LISTO') {
    desde = p.fechaListo ?? p.fechaRegistro;
    texto = 'en el pase';
  }
  const minutos = minutosDesde(desde);
  const limites = p.estado in LIMITES ? LIMITES[p.estado as keyof typeof LIMITES] : null;
  const color: Semaforo = !limites ? 'verde' : minutos <= limites[0] ? 'verde' : minutos <= limites[1] ? 'ambar' : 'rojo';
  return { minutos, color, texto: `${minutos} min ${texto}` };
}
