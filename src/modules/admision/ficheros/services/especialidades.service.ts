import type {
    Especialidad,
    PaginatedResponse,
    EspecialidadesQuery,
    RecordStatus,
  } from "../types/especialidades.types";
  
  import { api } from "../../../../shared/api";
  
  export type EspecialidadCreatePayload = {
    codigo: string;
    descripcion: string;
    estado?: RecordStatus;
  };
  
  export type EspecialidadUpdatePayload = {
    codigo: string;
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
    return api.post<{ data: Especialidad }>(
      `/admision/ficheros/especialidades`,
      payload
    );
  }
  
  export function updateEspecialidad(
    id: number,
    payload: EspecialidadUpdatePayload
  ): Promise<{ data: Especialidad }> {
    return api.request<{ data: Especialidad }>({
      method: "PUT",
      path: `/admision/ficheros/especialidades/${id}`,
      body: payload,
    });
  }
  
  export function deactivateEspecialidad(
    id: number
  ): Promise<{ data: Especialidad }> {
    return api.request<{ data: Especialidad }>({
      method: "PATCH",
      path: `/admision/ficheros/especialidades/${id}/desactivar`,
    });
  }
  