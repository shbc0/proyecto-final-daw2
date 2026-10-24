export interface Plato {
  idplato: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string | null;
  disponible: boolean;
  notas: string[];
}

export interface PlatoPayload {
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  disponible: boolean;
  notas: string[];
}
