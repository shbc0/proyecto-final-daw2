import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../core/auth.service';
import { Aviso, AvisosService } from '../core/avisos.service';

interface ItemMenu {
  ruta: string;
  texto: string;
}

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  host: { '(document:pointerdown)': 'avisos.desbloquearAudio()' },
  template: `
    <header class="barra no-print">
      <span class="marca">🍽️ Restaurante</span>

      <button class="btn-menu" type="button" (click)="alternarMenu()"
              [attr.aria-expanded]="menuAbierto()" aria-controls="menu-principal" aria-label="Menú">
        {{ menuAbierto() ? '✕' : '☰' }}
      </button>

      <div id="menu-principal" class="desplegable" [class.abierto]="menuAbierto()">
        <nav class="menu">
          @for (item of menu(); track item.ruta) {
            <a [routerLink]="item.ruta" routerLinkActive="activo" (click)="menuAbierto.set(false)">{{ item.texto }}</a>
          }
        </nav>

        <div class="usuario">
          @if (avisos.aplica()) {
            <button class="btn btn-secundario btn-peq" type="button" (click)="avisos.alternarSonido()"
                    [attr.aria-pressed]="avisos.sonidoActivo()"
                    [title]="avisos.sonidoActivo() ? 'Silenciar avisos' : 'Activar sonido de avisos'">
              {{ avisos.sonidoActivo() ? '🔔 Sonido' : '🔕 Silencio' }}
            </button>
          }
          <span>{{ auth.sesion()?.nomusuario }} · {{ auth.rolesTexto() }}</span>
          <button class="btn btn-secundario btn-peq" (click)="auth.logout()">Salir</button>
        </div>
      </div>
    </header>

    <div class="avisos no-print" aria-live="assertive">
      @for (a of avisos.avisos(); track a.id) {
        <div class="aviso-flotante" [class.aviso-alerta]="a.tipo === 'alerta'">
          <button type="button" class="aviso-texto" (click)="abrir(a)">{{ a.texto }}</button>
          <button type="button" class="aviso-cerrar" (click)="avisos.cerrar(a.id)" aria-label="Cerrar aviso">✕</button>
        </div>
      }
    </div>

    <main class="contenido">
      <router-outlet />
    </main>
  `,
  styles: `
    .barra {
      display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
      background: #3a2a22; color: #fff; padding: .7rem 1.5rem;
      position: sticky; top: 0; z-index: 20;
    }
    .marca { font-weight: 700; font-size: 1.2rem; }
    .btn-menu {
      display: none; margin-left: auto; background: none; border: 1px solid #6e5a4f; color: #fff;
      font-size: 1.3rem; width: 44px; height: 44px; border-radius: 8px; cursor: pointer;
    }
    .desplegable { display: flex; align-items: center; gap: 1rem; flex: 1; flex-wrap: wrap; }
    .menu { display: flex; gap: 1rem; flex: 1; flex-wrap: wrap; }
    .menu a { color: #e8d9cf; text-decoration: none; padding: .4rem .7rem; border-radius: 6px; }
    .menu a.activo { background: #b5452d; color: #fff; }
    .usuario { display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; }
    .contenido { max-width: 1100px; margin: 1.5rem auto; padding: 0 1rem; }

    .avisos {
      position: fixed; top: 4.5rem; right: 1rem; z-index: 30;
      display: flex; flex-direction: column; gap: .5rem; width: min(380px, calc(100vw - 2rem));
    }
    .aviso-flotante {
      display: flex; align-items: stretch; background: #1b6b32; color: #fff;
      border-radius: 10px; box-shadow: 0 6px 20px rgba(0, 0, 0, .25); overflow: hidden;
    }
    .aviso-alerta { background: #8a4b00; }
    .aviso-texto {
      flex: 1; background: none; border: 0; color: inherit; text-align: left;
      padding: .8rem 1rem; font-size: 1rem; font-weight: 600; cursor: pointer;
    }
    .aviso-cerrar { background: rgba(0, 0, 0, .15); border: 0; color: inherit; width: 44px; cursor: pointer; }

    @media (max-width: 768px) {
      .barra { padding: .6rem 1rem; }
      .btn-menu { display: block; }
      .desplegable { display: none; flex-basis: 100%; flex-direction: column; align-items: stretch; }
      .desplegable.abierto { display: flex; }
      .menu { flex-direction: column; gap: .2rem; }
      .menu a { padding: .75rem .8rem; font-size: 1.05rem; }
      .usuario { border-top: 1px solid #5a463b; padding-top: .7rem; }
      .contenido { margin: 1rem auto; }
      .avisos { top: 4.2rem; right: 1rem; }
    }
  `,
})
export class LayoutComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  avisos = inject(AvisosService);
  private router = inject(Router);

  menuAbierto = signal(false);

  ngOnInit(): void {
    this.avisos.iniciar();
  }

  ngOnDestroy(): void {
    this.avisos.detener();
  }

  alternarMenu(): void {
    this.menuAbierto.update((v) => !v);
  }

  abrir(a: Aviso): void {
    this.avisos.cerrar(a.id);
    this.router.navigate([a.ruta]);
  }

  menu(): ItemMenu[] {
    if (this.auth.esAdmin()) {
      return [
        { ruta: '/platos', texto: 'Carta' },
        { ruta: '/mesas', texto: 'Mesas' },
        { ruta: '/pedidos', texto: 'Pedidos' },
        { ruta: '/cocina', texto: 'Cocina' },
        { ruta: '/reportes', texto: 'Indicadores' },
        { ruta: '/usuarios', texto: 'Usuarios' },
      ];
    }
    if (this.auth.tieneRol('MOZO')) {
      return [
        { ruta: '/mesas', texto: 'Mesas' },
        { ruta: '/pedidos', texto: 'Pedidos' },
      ];
    }
    if (this.auth.tieneRol('COCINA')) {
      return [
        { ruta: '/cocina', texto: 'Cocina' },
        { ruta: '/platos', texto: 'Carta' },
      ];
    }
    return [];
  }
}
