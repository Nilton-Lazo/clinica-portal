import type {
  ParamOption,
  PaginatedResponse,
  ParamOptionQuery,
  RecordStatus,
} from "../types/paramOption.types";
import { api } from "../../../../../shared/api";

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
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("per_page", String(query.per_page ?? 50));
  const q = (query.q ?? "").trim();
  if (q) params.set("q", q);
  if (query.status) params.set("status", query.status);
  const s = params.toString();
  return s ? `?${s}` : "";
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
