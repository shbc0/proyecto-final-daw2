import { Routes } from '@angular/router';

import { authGuard, inicioGuard, roleGuard } from './core/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { LayoutComponent } from './layout/layout.component';
import { PlatosComponent } from './pages/platos/platos.component';
import { MesasComponent } from './pages/mesas/mesas.component';
import { PedidosComponent } from './pages/pedidos/pedidos.component';
import { PedidoFormComponent } from './pages/pedido-form/pedido-form.component';
import { CocinaComponent } from './pages/cocina/cocina.component';
import { CuentaComponent } from './pages/cuenta/cuenta.component';
import { ReportesComponent } from './pages/reportes/reportes.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'platos', component: PlatosComponent, canActivate: [roleGuard('ADMIN', 'COCINA')] },

      { path: 'mesas', component: MesasComponent, canActivate: [roleGuard('ADMIN', 'MOZO')] },
      { path: 'mesas/:idmesa/cuenta', component: CuentaComponent, canActivate: [roleGuard('ADMIN', 'MOZO')] },
      { path: 'pedidos', component: PedidosComponent, canActivate: [roleGuard('ADMIN', 'MOZO')] },
      { path: 'pedidos/nuevo', component: PedidoFormComponent, canActivate: [roleGuard('ADMIN', 'MOZO')] },
      { path: 'pedidos/:id/editar', component: PedidoFormComponent, canActivate: [roleGuard('ADMIN', 'MOZO')] },

      { path: 'cocina', component: CocinaComponent, canActivate: [roleGuard('ADMIN', 'COCINA')] },

      { path: 'reportes', component: ReportesComponent, canActivate: [roleGuard('ADMIN')] },

      { path: 'usuarios', component: UsuariosComponent, canActivate: [roleGuard('ADMIN')] },

      { path: '', pathMatch: 'full', canActivate: [inicioGuard], children: [] },
    ],
  },

  { path: '**', redirectTo: '' },
];
