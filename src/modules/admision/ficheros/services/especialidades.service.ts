import type {
  Especialidad,
  PaginatedResponse,
  EspecialidadesQuery,
  RecordStatus,
} from "../types/especialidades.types";

import { api } from "../../../../shared/api";

export type EspecialidadCreatePayload = {
  descripcion: string;
  estado?: RecordStatus;
};

export type EspecialidadUpdatePayload = {
  descripcion: string;
  estado: RecordStatus;
};

function buildQuery(query: EspecialidadesQuery): string {
  const params = new URLSearchParams();

  params.set("page", String(query.page ?? 1));
  params.set("per_page", String(query.per_page ?? 50));

  const q = (query.q ?? "").trim();
  if (q) params.set("q", q);

  if (query.status) params.set("status", query.status);

  const s = params.toString();
  return s ? `?${s}` : "";
}

function toStrOrEmpty(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

export async function getNextEspecialidadCodigo(): Promise<{ codigo: string }> {
  const res = await api.get<{ data: { codigo: unknown } }>(
    "/admision/ficheros/especialidades/next-codigo"
  );
  return { codigo: toStrOrEmpty(res.data?.codigo) };
}

export function listEspecialidades(
  query: EspecialidadesQuery
): Promise<PaginatedResponse<Especialidad>> {
  return api.get<PaginatedResponse<Especialidad>>(
    `/admision/ficheros/especialidades${buildQuery(query)}`
  );
}

export function createEspecialidad(
  payload: EspecialidadCreatePayload
): Promise<{ data: Especialidad }> {
  return api.post<{ data: Especialidad }>(`/admision/ficheros/especialidades`, {
    descripcion: payload.descripcion,
    estado: payload.estado,
  });
}

export function updateEspecialidad(
  id: number,
  payload: EspecialidadUpdatePayload
): Promise<{ data: Especialidad }> {
  return api.put<{ data: Especialidad }>(`/admision/ficheros/especialidades/${id}`, {
    descripcion: payload.descripcion,
    estado: payload.estado,
  });
}

export function deactivateEspecialidad(id: number): Promise<{ data: Especialidad }> {
  return api.patch<{ data: Especialidad }>(`/admision/ficheros/especialidades/${id}/desactivar`);
}
