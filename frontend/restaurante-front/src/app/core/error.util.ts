import { HttpErrorResponse } from '@angular/common/http';

export function mensajeError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor. ¿Están encendidos el gateway y los servicios?';
    }
    const msg = err.error?.message;
    if (typeof msg === 'string' && msg) {
      return msg;
    }
    if (err.status === 403) return 'No tienes permiso para realizar esta acción.';
    if (err.status === 401) return 'Tu sesión venció. Inicia sesión otra vez.';
    if (err.status === 503) return 'Un servicio no está disponible en este momento.';
    return `Error ${err.status}: no se pudo completar la operación.`;
  }
  return err instanceof Error ? err.message : 'Error inesperado';
}
