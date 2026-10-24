export interface Usuario {
  idusuario: number;
  nomusuario: string;
  email: string;
  nombres: string | null;
  apellidos: string | null;
  activo: boolean;
  roles: string[];
}

export interface Rol {
  idrol: number;
  nomrol: string;
}

export interface UsuarioPayload {
  nomusuario: string;
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  activo: boolean;
  rolesIds: number[];
}
