import type { Contratante, ContratantesQuery, PaginatedResponse, RecordStatus } from "../types/contratantes.types";
import { api } from "../../../../shared/api";

export type ContratanteCreatePayload = {
  razon_social: string;
  ruc: string | null;
  telefono: string | null;
  direccion: string | null;
  estado?: RecordStatus;
};

export type ContratanteUpdatePayload = {
  razon_social: string;
  ruc: string | null;
  telefono: string | null;
  direccion: string | null;
  estado: RecordStatus;
};

type ContratanteApi = {
  id: number;
  codigo?: unknown;
  razon_social?: unknown;
  ruc?: unknown;
  telefono?: unknown;
  direccion?: unknown;
  estado?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

function toStrOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    const s = v.trim();
    return s === "" ? null : s;
  }
  if (typeof v === "number") return String(v);
  return null;
}

function toStrOrEmpty(v: unknown): string {
  return toStrOrNull(v) ?? "";
}

function normalizeEstado(v: unknown): RecordStatus {
  const s = toStrOrEmpty(v).toUpperCase();
  if (s === "INACTIVO") return "INACTIVO";
  if (s === "SUSPENDIDO") return "SUSPENDIDO";
  return "ACTIVO";
}

function normalizeContratante(x: ContratanteApi): Contratante {
  return {
    id: x.id,
    codigo: toStrOrEmpty(x.codigo),
    razon_social: toStrOrEmpty(x.razon_social),
    ruc: toStrOrNull(x.ruc),
    telefono: toStrOrNull(x.telefono),
    direccion: toStrOrNull(x.direccion),
    estado: normalizeEstado(x.estado),
    created_at: toStrOrNull(x.created_at) ?? undefined,
    updated_at: toStrOrNull(x.updated_at) ?? undefined,
  };
}

function buildQuery(query: ContratantesQuery): string {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("per_page", String(query.per_page ?? 50));

  const q = (query.q ?? "").trim();
  if (q) params.set("q", q);

  if (query.status) params.set("status", query.status);

  const s = params.toString();
  return s ? `?${s}` : "";
}

export async function getNextContratanteCodigo(): Promise<{ codigo: string }> {
  const res = await api.get<{ data: { codigo: unknown } }>("/admision/ficheros/contratantes/next-codigo");
  return { codigo: toStrOrEmpty(res.data?.codigo) };
}

export async function listContratantes(query: ContratantesQuery): Promise<PaginatedResponse<Contratante>> {
  const res = await api.get<PaginatedResponse<ContratanteApi>>(`/admision/ficheros/contratantes${buildQuery(query)}`);
  return { ...res, data: res.data.map(normalizeContratante) };
}

export async function createContratante(payload: ContratanteCreatePayload): Promise<{ data: Contratante }> {
  const res = await api.post<{ data: ContratanteApi }>(`/admision/ficheros/contratantes`, payload);
  return { data: normalizeContratante(res.data) };
}

export async function updateContratante(id: number, payload: ContratanteUpdatePayload): Promise<{ data: Contratante }> {
  const res = await api.put<{ data: ContratanteApi }>(`/admision/ficheros/contratantes/${id}`, payload);
  return { data: normalizeContratante(res.data) };
}

export async function deactivateContratante(id: number): Promise<{ data: Contratante }> {
  const res = await api.patch<{ data: ContratanteApi }>(`/admision/ficheros/contratantes/${id}/desactivar`);
  return { data: normalizeContratante(res.data) };
}
