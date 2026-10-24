import { Injectable, inject, signal } from '@angular/core';

import { EstadoPedido, Pedido } from '../models/pedido.model';
import { PedidoService } from '../services/pedido.service';
import { AuthService } from './auth.service';

export interface Aviso {
  id: number;
  texto: string;
  ruta: string;
  tipo: 'ok' | 'alerta';
}

interface Evento {
  clave: string;
  texto: string;
  ruta: string;
  tipo: Aviso['tipo'];
}

const CLAVE_SONIDO = 'restaurante_sonido';
const CADA_MS = 5000;
const DURACION_AVISO_MS = 15000;

@Injectable({ providedIn: 'root' })
export class AvisosService {
  private pedidoService = inject(PedidoService);
  private auth = inject(AuthService);

  readonly avisos = signal<Aviso[]>([]);
  readonly sonidoActivo = signal(this.leerSonido());

  private vigilados: EstadoPedido[] | null = null;
  private conocidos: Set<string> | null = null;
  private timer?: ReturnType<typeof setInterval>;
  private audio?: AudioContext;
  private siguienteId = 1;

  aplica(): boolean {
    return this.estadosVigilados() !== null;
  }

  iniciar(): void {
    this.detener();
    this.vigilados = this.estadosVigilados();
    if (!this.vigilados) return;
    this.revisar();
    this.timer = setInterval(() => this.revisar(), CADA_MS);
  }

  detener(): void {
    clearInterval(this.timer);
    this.conocidos = null;
    this.avisos.set([]);
  }

  cerrar(id: number): void {
    this.avisos.update((lista) => lista.filter((a) => a.id !== id));
  }

  alternarSonido(): void {
    this.sonidoActivo.update((v) => !v);
    try {
      localStorage.setItem(CLAVE_SONIDO, String(this.sonidoActivo()));
    } catch {
    }
  }

  desbloquearAudio(): void {
    if (!this.audio) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.audio = new Ctx();
    }
    if (this.audio.state === 'suspended') {
      this.audio.resume().catch(() => undefined);
    }
  }

  private estadosVigilados(): EstadoPedido[] | null {
    if (this.auth.tieneRol('MOZO')) return ['PENDIENTE', 'LISTO'];
    if (this.auth.tieneRol('COCINA')) return ['PENDIENTE'];
    return null;
  }

  private revisar(): void {
    const estados = this.vigilados;
    if (!estados) return;
    this.pedidoService.listar(estados).subscribe({
      next: (pedidos) => {
        const eventos = this.auth.tieneRol('MOZO') ? this.eventosMozo(pedidos) : this.eventosCocina(pedidos);
        const nuevos = this.conocidos ? eventos.filter((e) => !this.conocidos!.has(e.clave)) : [];
        this.conocidos = new Set(eventos.map((e) => e.clave));
        if (nuevos.length > 0) {
          nuevos.forEach((e) => this.agregar(e));
          this.alertar();
        }
      },
      error: () => undefined,
    });
  }

  private eventosMozo(pedidos: Pedido[]): Evento[] {
    const eventos: Evento[] = [];
    for (const p of pedidos) {
      if (p.estado === 'LISTO') {
        eventos.push({
          clave: `listo-${p.idpedido}`,
          texto: `Mesa ${p.numeroMesa}: pedido #${p.idpedido}${this.adicional(p)} listo para recoger`,
          ruta: '/pedidos',
          tipo: 'ok',
        });
      }
      for (const d of p.detalles.filter((x) => x.agotado)) {
        eventos.push({
          clave: `agotado-${d.iddetalle}`,
          texto: `Mesa ${p.numeroMesa}: se agotó "${d.nombrePlato}" (pedido #${p.idpedido}). Cámbialo con el cliente`,
          ruta: `/pedidos/${p.idpedido}/editar`,
          tipo: 'alerta',
        });
      }
    }
    return eventos;
  }

  private eventosCocina(pedidos: Pedido[]): Evento[] {
    return pedidos.map((p) => ({
      clave: `nuevo-${p.idpedido}`,
      texto: `Nuevo pedido #${p.idpedido}${this.adicional(p)} · Mesa ${p.numeroMesa}`,
      ruta: '/cocina',
      tipo: 'ok' as const,
    }));
  }

  private adicional(p: Pedido): string {
    return p.adicional ? ' (adicional)' : '';
  }

  private agregar(e: Evento): void {
    const aviso: Aviso = { id: this.siguienteId++, texto: e.texto, ruta: e.ruta, tipo: e.tipo };
    this.avisos.update((lista) => [...lista, aviso]);
    setTimeout(() => this.cerrar(aviso.id), DURACION_AVISO_MS);
  }

  private alertar(): void {
    navigator.vibrate?.([200, 100, 200]);
    if (this.sonidoActivo()) {
      this.pitido();
    }
  }

  private pitido(): void {
    const ctx = this.audio;
    if (!ctx || ctx.state !== 'running') return;
    [0, 0.25].forEach((inicio, i) => {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.frequency.value = i === 0 ? 880 : 1175;
      vol.gain.setValueAtTime(0.25, ctx.currentTime + inicio);
      vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + inicio + 0.2);
      osc.connect(vol).connect(ctx.destination);
      osc.start(ctx.currentTime + inicio);
      osc.stop(ctx.currentTime + inicio + 0.2);
    });
  }

  private leerSonido(): boolean {
    try {
      return localStorage.getItem(CLAVE_SONIDO) !== 'false';
    } catch {
      return true;
    }
  }
}
