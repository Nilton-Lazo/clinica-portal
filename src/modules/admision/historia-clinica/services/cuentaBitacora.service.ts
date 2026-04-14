import { api } from "../../../../shared/api";

export type CuentaBitacoraNotaUsuario = {
  id: number;
  username: string;
  nombre: string;
};

export type CuentaBitacoraNotaItem = {
  id: number;
  contenido: string;
  created_at: string;
  usuario: CuentaBitacoraNotaUsuario;
};

type ListMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

type ListResponse = {
  data: CuentaBitacoraNotaItem[];
  meta: ListMeta;
};

type CreateResponse = {
  data: CuentaBitacoraNotaItem;
};

function unwrapData<T>(res: unknown): T {
  if (res && typeof res === "object" && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export async function listCuentaBitacoraNotas(
  nroCuenta: string,
  params?: { page?: number; per_page?: number }
): Promise<ListResponse> {
  const q = new URLSearchParams();
  if (params?.page != null) q.set("page", String(params.page));
  if (params?.per_page != null) q.set("per_page", String(params.per_page));
  const suffix = q.toString() ? `?${q.toString()}` : "";
  const res = await api.get<unknown>(
    `/admision/cuentas/${encodeURIComponent(nroCuenta)}/bitacora-notas${suffix}`
  );
  return res as ListResponse;
}

export async function createCuentaBitacoraNota(nroCuenta: string, contenido: string): Promise<CuentaBitacoraNotaItem> {
  const res = await api.post<unknown>(`/admision/cuentas/${encodeURIComponent(nroCuenta)}/bitacora-notas`, {
    contenido,
  });
  return unwrapData<CuentaBitacoraNotaItem>(res);
}

export async function listPacienteBitacoraNotas(
  pacienteId: number,
  params?: { page?: number; per_page?: number }
): Promise<ListResponse> {
  const q = new URLSearchParams();
  if (params?.page != null) q.set("page", String(params.page));
  if (params?.per_page != null) q.set("per_page", String(params.per_page));
  const suffix = q.toString() ? `?${q.toString()}` : "";
  const res = await api.get<unknown>(`/admision/pacientes/${pacienteId}/bitacora-notas${suffix}`);
  return res as ListResponse;
}

export async function createPacienteBitacoraNota(pacienteId: number, contenido: string): Promise<CuentaBitacoraNotaItem> {
  const res = await api.post<unknown>(`/admision/pacientes/${pacienteId}/bitacora-notas`, {
    contenido,
  });
  return unwrapData<CuentaBitacoraNotaItem>(res);
}
