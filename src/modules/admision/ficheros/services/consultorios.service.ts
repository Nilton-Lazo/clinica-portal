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
  es_tercero: boolean;
  estado?: RecordStatus;
};

export type ConsultorioUpdatePayload = {
  abreviatura: string;
  descripcion: string;
  es_tercero: boolean;
  estado: RecordStatus;
};

type ConsultorioApi = {
  id: number;
  abreviatura: string;
  descripcion: string;
  estado: RecordStatus;
  es_tercero?: unknown;
  es_terceros?: unknown;
  created_at?: string;
  updated_at?: string;
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

function coerceBool(v: unknown): boolean {
  if (v === true) return true;
  if (v === false) return false;
  if (v === 1 || v === "1") return true;
  if (v === 0 || v === "0") return false;

  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "t" || s === "yes" || s === "y" || s === "on") return true;
    if (s === "false" || s === "f" || s === "no" || s === "n" || s === "off" || s === "") return false;
    if (/^\d+$/.test(s)) return Number(s) !== 0;
  }

  if (typeof v === "number") return v !== 0;
  return false;
}

function normalizeConsultorio(x: ConsultorioApi): Consultorio {
  const raw = x.es_tercero !== undefined ? x.es_tercero : x.es_terceros;

  return {
    id: x.id,
    abreviatura: x.abreviatura,
    descripcion: x.descripcion,
    estado: x.estado,
    es_tercero: coerceBool(raw),
    created_at: x.created_at,
    updated_at: x.updated_at,
  };
}

export async function listConsultorios(
  query: ConsultoriosQuery
): Promise<PaginatedResponse<Consultorio>> {
  const res = await api.get<PaginatedResponse<ConsultorioApi>>(
    `/admision/ficheros/consultorios${buildQuery(query)}`
  );

  return {
    ...res,
    data: res.data.map(normalizeConsultorio),
  };
}

export async function createConsultorio(
  payload: ConsultorioCreatePayload
): Promise<{ data: Consultorio }> {
  const res = await api.post<{ data: ConsultorioApi }>(`/admision/ficheros/consultorios`, {
    abreviatura: payload.abreviatura,
    descripcion: payload.descripcion,
    es_tercero: payload.es_tercero,
    estado: payload.estado,
  });

  return { data: normalizeConsultorio(res.data) };
}

export async function updateConsultorio(
  id: number,
  payload: ConsultorioUpdatePayload
): Promise<{ data: Consultorio }> {
  const res = await api.request<{ data: ConsultorioApi }>({
    method: "PUT",
    path: `/admision/ficheros/consultorios/${id}`,
    body: {
      abreviatura: payload.abreviatura,
      descripcion: payload.descripcion,
      es_tercero: payload.es_tercero,
      estado: payload.estado,
    },
  });

  return { data: normalizeConsultorio(res.data) };
}

export async function deactivateConsultorio(id: number): Promise<{ data: Consultorio }> {
  const res = await api.request<{ data: ConsultorioApi }>({
    method: "PATCH",
    path: `/admision/ficheros/consultorios/${id}/desactivar`,
  });

  return { data: normalizeConsultorio(res.data) };
}
