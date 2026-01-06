export type LoginPayload = {
  identifier: string;
  password: string;
};

export type AuthUser = {
  id: number;
  username: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string | null;
  nivel: string;
  estado: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};
