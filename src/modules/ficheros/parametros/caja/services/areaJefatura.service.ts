import type {
  ParamOption,
  PaginatedResponse,
  ParamOptionQuery,
  RecordStatus,
} from "../../emergencia/types/paramOption.types";
import { api } from "../../../../../shared/api";

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
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("per_page", String(query.per_page ?? 50));
  const q = (query.q ?? "").trim();
  if (q) params.set("q", q);
  if (query.status) params.set("status", query.status);
  const s = params.toString();
  return s ? `?${s}` : "";
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
