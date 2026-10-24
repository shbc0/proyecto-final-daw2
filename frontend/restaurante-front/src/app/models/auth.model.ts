export interface GenericResponse<T> {
  response: T | null;
  error: { statusCode?: number; message?: string; description?: string } | null;
}

export interface UsuarioSesion {
  idusuario: number;
  nomusuario: string;
  roles: string[];
  token: string;
}
