export type EstadoMesa = 'LIBRE' | 'OCUPADA';

export interface Mesa {
  idmesa: number;
  numero: number;
  capacidad: number;
  estado: EstadoMesa;
  comensales: number | null;
  fechaOcupacion: string | null;
}

export interface MesaPayload {
  numero: number;
  capacidad: number;
}
