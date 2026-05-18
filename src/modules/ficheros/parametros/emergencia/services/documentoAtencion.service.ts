import type {
  ParamOption,
  PaginatedResponse,
  ParamOptionQuery,
  RecordStatus,
} from "../types/paramOption.types";
import { api } from "../../../../../shared/api";
import { buildListQuery } from "../../../../../shared/datagrid";

const BASE = "/ficheros/parametros/emergencia/documento-atencion";

export type DocumentoAtencionCreatePayload = {
  codigo: string;
  descripcion: string;
  estado?: RecordStatus;
};

export type DocumentoAtencionUpdatePayload = {
  codigo: string;
  descripcion: string;
  estado: RecordStatus;
};

function buildQuery(query: ParamOptionQuery): string {
  return buildListQuery({
    page: query.page ?? 1,
    per_page: query.per_page ?? 50,
    q: query.q,
    status: query.status,
    sort: query.sort,
    sort_dir: query.sort_dir,
  });
}

export async function getNextDocumentoAtencionCodigo(): Promise<{ codigo: string }> {
  const res = await api.get<{ data: { codigo: unknown } }>(`${BASE}/next-codigo`);
  return { codigo: String(res.data?.codigo ?? "").trim() };
}

export function listDocumentoAtencion(query: ParamOptionQuery): Promise<PaginatedResponse<ParamOption>> {
  return api.get<PaginatedResponse<ParamOption>>(`${BASE}${buildQuery(query)}`);
}

export function createDocumentoAtencion(payload: DocumentoAtencionCreatePayload): Promise<{ data: ParamOption }> {
  return api.post<{ data: ParamOption }>(BASE, payload);
}

export function updateDocumentoAtencion(id: number, payload: DocumentoAtencionUpdatePayload): Promise<{ data: ParamOption }> {
  return api.put<{ data: ParamOption }>(`${BASE}/${id}`, payload);
}

export function deactivateDocumentoAtencion(id: number): Promise<{ data: ParamOption }> {
  return api.patch<{ data: ParamOption }>(`${BASE}/${id}/desactivar`);
}
