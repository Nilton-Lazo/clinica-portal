import type { Cirugia, CirugiasQuery, PaginatedResponse, RecordStatus } from "../types/cirugias.types";
import { api } from "../../../shared/api";
import { buildListQuery } from "../../../shared/datagrid";

export type CirugiaCreatePayload = {
  descripcion: string;
  estado?: RecordStatus;
};

export type CirugiaUpdatePayload = {
  descripcion: string;
  estado: RecordStatus;
};

function buildQuery(query: CirugiasQuery): string {
  return buildListQuery({
    page: query.page ?? 1,
    per_page: query.per_page ?? 10,
    q: query.q,
    status: query.status,
    sort: query.sort,
    sort_dir: query.sort_dir,
  });
}

function toStrOrEmpty(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

export async function getNextCirugiaCodigo(): Promise<{ codigo: string }> {
  const res = await api.get<{ data: { codigo: unknown } }>("/ficheros/cirugias/next-codigo");
  return { codigo: toStrOrEmpty(res.data?.codigo) };
}

export function listCirugias(query: CirugiasQuery): Promise<PaginatedResponse<Cirugia>> {
  return api.get<PaginatedResponse<Cirugia>>(`/ficheros/cirugias${buildQuery(query)}`);
}

export function createCirugia(payload: CirugiaCreatePayload): Promise<{ data: Cirugia }> {
  return api.post<{ data: Cirugia }>(`/ficheros/cirugias`, {
    descripcion: payload.descripcion,
    estado: payload.estado,
  });
}

export function updateCirugia(id: number, payload: CirugiaUpdatePayload): Promise<{ data: Cirugia }> {
  return api.put<{ data: Cirugia }>(`/ficheros/cirugias/${id}`, {
    descripcion: payload.descripcion,
    estado: payload.estado,
  });
}

export function deactivateCirugia(id: number): Promise<{ data: Cirugia }> {
  return api.patch<{ data: Cirugia }>(`/ficheros/cirugias/${id}/desactivar`);
}
