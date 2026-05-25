import type {
  ParamOption,
  PaginatedResponse,
  ParamOptionQuery,
  RecordStatus,
} from "../../emergencia/types/paramOption.types";
import { api } from "../../../../../shared/api";
import { buildListQuery } from "../../../../../shared/datagrid";

const BASE = "/ficheros/parametros/caja/tipo-documento";

export type TipoDocumentoCajaCreatePayload = {
  codigo: string;
  descripcion: string;
  estado?: RecordStatus;
};

export type TipoDocumentoCajaUpdatePayload = {
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

export async function getNextTipoDocumentoCajaCodigo(): Promise<{ codigo: string }> {
  const res = await api.get<{ data: { codigo: unknown } }>(`${BASE}/next-codigo`);
  return { codigo: String(res.data?.codigo ?? "").trim() };
}

export function listTipoDocumentoCaja(query: ParamOptionQuery): Promise<PaginatedResponse<ParamOption>> {
  return api.get<PaginatedResponse<ParamOption>>(`${BASE}${buildQuery(query)}`);
}

export function createTipoDocumentoCaja(payload: TipoDocumentoCajaCreatePayload): Promise<{ data: ParamOption }> {
  return api.post<{ data: ParamOption }>(BASE, payload);
}

export function updateTipoDocumentoCaja(id: number, payload: TipoDocumentoCajaUpdatePayload): Promise<{ data: ParamOption }> {
  return api.put<{ data: ParamOption }>(`${BASE}/${id}`, payload);
}

export function deactivateTipoDocumentoCaja(id: number): Promise<{ data: ParamOption }> {
  return api.patch<{ data: ParamOption }>(`${BASE}/${id}/desactivar`);
}
