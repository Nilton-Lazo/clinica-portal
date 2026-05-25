import type {
  Especialidad,
  PaginatedResponse,
  EspecialidadesQuery,
  RecordStatus,
} from "../types/especialidades.types";

import { api } from "../../../shared/api";
import { buildListQuery } from "../../../shared/datagrid";

export type EspecialidadCreatePayload = {
  descripcion: string;
  estado?: RecordStatus;
};

export type EspecialidadUpdatePayload = {
  descripcion: string;
  estado: RecordStatus;
};

function buildQuery(query: EspecialidadesQuery): string {
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

export async function getNextEspecialidadCodigo(): Promise<{ codigo: string }> {
  const res = await api.get<{ data: { codigo: unknown } }>(
    "/ficheros/especialidades/next-codigo"
  );
  return { codigo: toStrOrEmpty(res.data?.codigo) };
}

export function listEspecialidades(
  query: EspecialidadesQuery
): Promise<PaginatedResponse<Especialidad>> {
  return api.get<PaginatedResponse<Especialidad>>(
    `/ficheros/especialidades${buildQuery(query)}`
  );
}

export function createEspecialidad(
  payload: EspecialidadCreatePayload
): Promise<{ data: Especialidad }> {
  return api.post<{ data: Especialidad }>(`/ficheros/especialidades`, {
    descripcion: payload.descripcion,
    estado: payload.estado,
  });
}

export function updateEspecialidad(
  id: number,
  payload: EspecialidadUpdatePayload
): Promise<{ data: Especialidad }> {
  return api.put<{ data: Especialidad }>(`/ficheros/especialidades/${id}`, {
    descripcion: payload.descripcion,
    estado: payload.estado,
  });
}

export function deactivateEspecialidad(id: number): Promise<{ data: Especialidad }> {
  return api.patch<{ data: Especialidad }>(`/ficheros/especialidades/${id}/desactivar`);
}
