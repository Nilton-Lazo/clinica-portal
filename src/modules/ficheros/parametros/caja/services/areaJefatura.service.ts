import type {
  ParamOption,
  PaginatedResponse,
  ParamOptionQuery,
  RecordStatus,
} from "../../emergencia/types/paramOption.types";
import { api } from "../../../../../shared/api";
import { buildListQuery } from "../../../../../shared/datagrid";

const BASE = "/ficheros/parametros/caja/area-jefatura";

export type AreaJefaturaCreatePayload = {
  codigo: string;
  descripcion: string;
  estado?: RecordStatus;
};

export type AreaJefaturaUpdatePayload = {
  codigo: string;
  descripcion: string;
  estado: RecordStatus;
};

function buildQuery(query: ParamOptionQuery): string {
  return buildListQuery({
    page: query.page ?? 1,
    per_page: query.per_page ?? 10,
    q: query.q,
    status: query.status,
    sort: query.sort,
    sort_dir: query.sort_dir,
  });
}

export async function getNextAreaJefaturaCodigo(): Promise<{ codigo: string }> {
  const res = await api.get<{ data: { codigo: unknown } }>(`${BASE}/next-codigo`);
  return { codigo: String(res.data?.codigo ?? "").trim() };
}

export function listAreaJefatura(query: ParamOptionQuery): Promise<PaginatedResponse<ParamOption>> {
  return api.get<PaginatedResponse<ParamOption>>(`${BASE}${buildQuery(query)}`);
}

export function createAreaJefatura(payload: AreaJefaturaCreatePayload): Promise<{ data: ParamOption }> {
  return api.post<{ data: ParamOption }>(BASE, payload);
}

export function updateAreaJefatura(id: number, payload: AreaJefaturaUpdatePayload): Promise<{ data: ParamOption }> {
  return api.put<{ data: ParamOption }>(`${BASE}/${id}`, payload);
}

export function deactivateAreaJefatura(id: number): Promise<{ data: ParamOption }> {
  return api.patch<{ data: ParamOption }>(`${BASE}/${id}/desactivar`);
}
