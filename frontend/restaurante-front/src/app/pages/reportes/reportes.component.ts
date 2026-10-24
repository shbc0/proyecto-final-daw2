import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { mensajeError } from '../../core/error.util';
import { LIMITES } from '../../core/tiempo.util';
import { Reporte } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte.service';

type Periodo = 'hoy' | '7' | '30' | 'rango';

interface TiempoEtapa {
  etiqueta: string;
  minutos: number | null;
  meta: number | null;
}

function iso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function haceDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return iso(d);
}

@Component({
  selector: 'app-reportes',
  imports: [FormsModule, DecimalPipe],
  template: `
    <div class="barra-titulo">
      <h2>Indicadores</h2>
    </div>

    <div class="filtro-periodo">
      <div class="segmentado" role="group" aria-label="Periodo">
        @for (op of opciones; track op.valor) {
          <button type="button" [class.activo]="periodo() === op.valor" [attr.aria-pressed]="periodo() === op.valor"
                  (click)="elegir(op.valor)">{{ op.texto }}</button>
        }
      </div>
      @if (periodo() === 'rango') {
        <label class="inline">Desde <input type="date" [ngModel]="desde()" (ngModelChange)="desde.set($event)" /></label>
        <label class="inline">Hasta <input type="date" [ngModel]="hasta()" (ngModelChange)="hasta.set($event)" /></label>
        <button class="btn btn-peq" (click)="cargar()">Aplicar</button>
      }
    </div>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @if (reporte(); as r) {
      <section class="tarjeta">
        <p class="kpi-etiqueta">Ventas del periodo</p>
        <p class="kpi-heroe">S/ {{ r.ventas | number: '1.2-2' }}</p>
        <p class="suave">
          {{ r.cuentasCerradas }} cuenta(s) cerrada(s) · ticket promedio S/ {{ r.ticketPromedio | number: '1.2-2' }}
          · {{ r.comensales }} comensales
          @if (r.minutosOcupacionMesa !== null) {
            · mesa ocupada {{ r.minutosOcupacionMesa | number: '1.0-1' }} min en promedio
          }
        </p>
      </section>

      <h3>Tiempos de atención (promedio)</h3>
      <div class="grid-kpi">
        @for (t of tiempos(); track t.etiqueta) {
          <div class="tarjeta kpi">
            <p class="kpi-etiqueta">{{ t.etiqueta }}</p>
            <p class="kpi-valor">{{ t.minutos === null ? '—' : (t.minutos | number: '1.0-1') + ' min' }}</p>
            @if (t.meta !== null && t.minutos !== null) {
              <p class="kpi-meta" [class.kpi-fuera]="t.minutos > t.meta">
                {{ t.minutos > t.meta ? '▲ sobre la meta' : '✓ dentro de la meta' }} (≤ {{ t.meta }} min)
              </p>
            }
          </div>
        }
      </div>

      <h3>Pedidos</h3>
      <div class="grid-kpi">
        <div class="tarjeta kpi"><p class="kpi-etiqueta">Registrados</p><p class="kpi-valor">{{ r.pedidosRegistrados }}</p></div>
        <div class="tarjeta kpi"><p class="kpi-etiqueta">Entregados</p><p class="kpi-valor">{{ r.pedidosEntregados }}</p></div>
        <div class="tarjeta kpi"><p class="kpi-etiqueta">En curso</p><p class="kpi-valor">{{ r.pedidosEnCurso }}</p></div>
        <div class="tarjeta kpi">
          <p class="kpi-etiqueta">Anulados</p>
          <p class="kpi-valor">{{ r.pedidosAnulados }}</p>
          @if (r.pedidosRegistrados > 0) {
            <p class="kpi-meta">{{ (100 * r.pedidosAnulados / r.pedidosRegistrados) | number: '1.0-1' }} % del total</p>
          }
        </div>
        <div class="tarjeta kpi"><p class="kpi-etiqueta">Platos agotados en pedidos</p><p class="kpi-valor">{{ r.platosAgotados }}</p></div>
      </div>

      <div class="grid-graficos">
        <section class="tarjeta">
          <h3>Platos más pedidos</h3>
          <p class="suave">Unidades servidas (pedidos entregados)</p>
          @for (p of r.platosTop; track p.nombrePlato) {
            <div class="barra-fila">
              <span class="barra-nombre">{{ p.nombrePlato }}</span>
              <span class="barra-pista">
                <span class="barra-dato" tabindex="0" [style.width.%]="pct(p.cantidad, maxPlato())"
                      [attr.data-tip]="p.cantidad + ' unid. · S/ ' + (p.importe | number: '1.2-2')"
                      [attr.aria-label]="p.nombrePlato + ': ' + p.cantidad + ' unidades'"></span>
                <span class="barra-valor">{{ p.cantidad }}</span>
              </span>
            </div>
          } @empty {
            <p class="suave">Sin pedidos entregados en el periodo.</p>
          }
        </section>

        <section class="tarjeta">
          <h3>Pedidos por hora</h3>
          <p class="suave">Horas punta del periodo
            @if (horaPunta(); as hp) {
              · más pedidos a las {{ hp.hora }}:00 ({{ hp.pedidos }})
            }
          </p>
          @if (r.porHora.length > 0) {
            <div class="columnas-hora" role="img" aria-label="Pedidos registrados por hora del día">
              @for (h of r.porHora; track h.hora) {
                <div class="col-hora">
                  <span class="col-valor">{{ h === horaPunta() ? h.pedidos : '' }}</span>
                  <span class="col" tabindex="0" [style.height.%]="pct(h.pedidos, maxHora())"
                        [attr.data-tip]="h.hora + ':00 · ' + h.pedidos + ' pedido(s)'"></span>
                </div>
              }
            </div>
            <div class="eje-horas" aria-hidden="true">
              @for (h of r.porHora; track h.hora) {
                <span>{{ h.hora }}h</span>
              }
            </div>
            <details>
              <summary>Ver como tabla</summary>
              <table>
                <thead><tr><th>Hora</th><th>Pedidos</th></tr></thead>
                <tbody>
                  @for (h of r.porHora; track h.hora) {
                    <tr><td>{{ h.hora }}:00</td><td>{{ h.pedidos }}</td></tr>
                  }
                </tbody>
              </table>
            </details>
          } @else {
            <p class="suave">Sin pedidos en el periodo.</p>
          }
        </section>
      </div>

      <div class="grid-graficos">
        <section class="tarjeta">
          <h3>Por mozo</h3>
          <table class="tabla-responsiva">
            <thead><tr><th>Mozo</th><th class="num">Registró</th><th class="num">Entregó</th><th class="num">Anulados</th></tr></thead>
            <tbody>
              @for (m of r.porMozo; track m.mozo) {
                <tr>
                  <td data-label="Mozo"><strong>{{ m.mozo }}</strong></td>
                  <td data-label="Registró" class="num">{{ m.registrados }}</td>
                  <td data-label="Entregó" class="num">{{ m.entregados }}</td>
                  <td data-label="Anulados" class="num">{{ m.anulados }}</td>
                </tr>
              } @empty {
                <tr><td colspan="4">Sin pedidos en el periodo.</td></tr>
              }
            </tbody>
          </table>
        </section>

        <section class="tarjeta">
          <h3>Rotación de mesas</h3>
          <table class="tabla-responsiva">
            <thead><tr><th>Mesa</th><th class="num">Veces atendida</th><th class="num">Ventas</th><th class="num">Tiempo prom.</th></tr></thead>
            <tbody>
              @for (m of r.porMesa; track m.numeroMesa) {
                <tr>
                  <td data-label="Mesa"><strong>Mesa {{ m.numeroMesa }}</strong></td>
                  <td data-label="Veces atendida" class="num">{{ m.cuentas }}</td>
                  <td data-label="Ventas" class="num">S/ {{ m.ventas | number: '1.2-2' }}</td>
                  <td data-label="Tiempo prom." class="num">
                    {{ m.minutosPromedio === null ? '—' : (m.minutosPromedio | number: '1.0-1') + ' min' }}
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="4">Ninguna cuenta cerrada en el periodo.</td></tr>
              }
            </tbody>
          </table>
        </section>
      </div>
    } @else if (!error()) {
      <p class="suave">Cargando indicadores...</p>
    }
  `,
})
export class ReportesComponent implements OnInit {
  private reporteService = inject(ReporteService);

  opciones: { valor: Periodo; texto: string }[] = [
    { valor: 'hoy', texto: 'Hoy' },
    { valor: '7', texto: 'Últimos 7 días' },
    { valor: '30', texto: 'Últimos 30 días' },
    { valor: 'rango', texto: 'Rango' },
  ];
  periodo = signal<Periodo>('hoy');
  desde = signal(iso(new Date()));
  hasta = signal(iso(new Date()));
  reporte = signal<Reporte | null>(null);
  error = signal('');

  maxPlato = computed(() => Math.max(1, ...(this.reporte()?.platosTop.map((p) => p.cantidad) ?? [])));
  maxHora = computed(() => Math.max(1, ...(this.reporte()?.porHora.map((h) => h.pedidos) ?? [])));
  horaPunta = computed(() => {
    const horas = this.reporte()?.porHora ?? [];
    return horas.length ? horas.reduce((a, b) => (b.pedidos > a.pedidos ? b : a)) : null;
  });

  tiempos = computed<TiempoEtapa[]>(() => {
    const r = this.reporte();
    if (!r) return [];
    return [
      { etiqueta: 'Espera hasta que la cocina lo empieza', minutos: r.minutosEspera, meta: LIMITES.PENDIENTE[0] },
      { etiqueta: 'Preparación', minutos: r.minutosPreparacion, meta: LIMITES.EN_PREPARACION[0] },
      { etiqueta: 'Listo en el pase hasta la entrega', minutos: r.minutosPase, meta: LIMITES.LISTO[0] },
      { etiqueta: 'Total: del registro a la mesa', minutos: r.minutosTotal, meta: null },
    ];
  });

  ngOnInit(): void {
    this.cargar();
  }

  elegir(p: Periodo): void {
    this.periodo.set(p);
    if (p === 'rango') return;
    this.desde.set(p === 'hoy' ? iso(new Date()) : haceDias(Number(p) - 1));
    this.hasta.set(iso(new Date()));
    this.cargar();
  }

  cargar(): void {
    this.error.set('');
    this.reporteService.resumen(this.desde(), this.hasta()).subscribe({
      next: (r) => this.reporte.set(r),
      error: (e: unknown) => this.error.set(mensajeError(e)),
    });
  }

  pct(valor: number, max: number): number {
    return valor === 0 ? 0 : Math.max(3, (100 * valor) / max);
  }
}
