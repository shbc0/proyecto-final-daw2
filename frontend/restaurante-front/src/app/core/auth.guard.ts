import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.sesionValida()) {
    return true;
  }
  auth.limpiarSesion();
  return router.createUrlTree(['/login']);
};

export function roleGuard(...roles: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    return roles.some((r) => auth.tieneRol(r)) ? true : router.createUrlTree([auth.rutaInicio()]);
  };
}

export const inicioGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return inject(Router).createUrlTree([auth.rutaInicio()]);
};
