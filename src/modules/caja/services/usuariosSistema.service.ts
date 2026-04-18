import { api } from "../../../shared/api";

export type UsuarioSistemaOption = {
  id: number;
  username: string;
  label: string;
};

export async function listUsuariosActivos(): Promise<UsuarioSistemaOption[]> {
  const res = await api.get<{ data: UsuarioSistemaOption[] }>("/seguridad/usuarios");
  return Array.isArray(res.data) ? res.data : [];
}
