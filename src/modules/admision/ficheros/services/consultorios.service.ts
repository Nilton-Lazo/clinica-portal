import type {
    Consultorio,
    PaginatedResponse,
    ConsultoriosQuery,
    RecordStatus,
  } from "../types/consultorios.types";
  
  import { api } from "../../../../shared/api";
  
  export type ConsultorioCreatePayload = {
    abreviatura: string;
    descripcion: string;
    es_terceros: boolean;
    estado?: RecordStatus;
  };
  
  export type ConsultorioUpdatePayload = {
    abreviatura: string;
    descripcion: string;
    es_terceros: boolean;
    estado: RecordStatus;
  };
  
  function buildQuery(query: ConsultoriosQuery): string {
    const params = new URLSearchParams();
  
    params.set("page", String(query.page ?? 1));
    params.set("per_page", String(query.per_page ?? 50));
  
    const q = (query.q ?? "").trim();
    if (q) params.set("q", q);
  
    if (query.status) params.set("status", query.status);
  
    const s = params.toString();
    return s ? `?${s}` : "";
  }
  
  export function listConsultorios(
    query: ConsultoriosQuery
  ): Promise<PaginatedResponse<Consultorio>> {
    return api.get<PaginatedResponse<Consultorio>>(
      `/admision/ficheros/consultorios${buildQuery(query)}`
    );
  }
  
  export function createConsultorio(
    payload: ConsultorioCreatePayload
  ): Promise<{ data: Consultorio }> {
    return api.post<{ data: Consultorio }>(`/admision/ficheros/consultorios`, payload);
  }
  
  export function updateConsultorio(
    id: number,
    payload: ConsultorioUpdatePayload
  ): Promise<{ data: Consultorio }> {
    return api.request<{ data: Consultorio }>({
      method: "PUT",
      path: `/admision/ficheros/consultorios/${id}`,
      body: payload,
    });
  }
  
  export function deactivateConsultorio(id: number): Promise<{ data: Consultorio }> {
    return api.request<{ data: Consultorio }>({
      method: "PATCH",
      path: `/admision/ficheros/consultorios/${id}/desactivar`,
    });
  }
  