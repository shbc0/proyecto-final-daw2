export interface Reporte {
  desde: string;
  hasta: string;

  pedidosRegistrados: number;
  pedidosEntregados: number;
  pedidosAnulados: number;
  pedidosEnCurso: number;
  platosAgotados: number;

  minutosEspera: number | null;
  minutosPreparacion: number | null;
  minutosPase: number | null;
  minutosTotal: number | null;

  cuentasCerradas: number;
  ventas: number;
  ticketPromedio: number;
  comensales: number;
  minutosOcupacionMesa: number | null;

  platosTop: { nombrePlato: string; cantidad: number; importe: number }[];
  porMozo: { mozo: string; registrados: number; entregados: number; anulados: number }[];
  porMesa: { numeroMesa: number; cuentas: number; ventas: number; minutosPromedio: number | null }[];
  porHora: { hora: number; pedidos: number }[];
}
