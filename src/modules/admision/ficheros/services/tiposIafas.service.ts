import type { PaginatedResponse, RecordStatus, TipoIafa, TiposIafasQuery } from "../types/tiposIafas.types";
import { api } from "../../../../shared/api";

export type TipoIafaCreatePayload = {
  descripcion: string;
  estado?: RecordStatus;
};

export type TipoIafaUpdatePayload = {
  descripcion: string;
  estado: RecordStatus;
};

type TipoIafaApi = {
  id: number;
  codigo?: unknown;
  descripcion?: unknown;
  estado?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

export async function getNextTipoIafaCodigo(): Promise<{ codigo: string }> {
  const res = await api.get<{ data: { codigo: unknown } }>("/admision/ficheros/tipos-iafas/next-codigo");
  return { codigo: toStrOrEmpty(res.data?.codigo) };
}

function buildQuery(query: TiposIafasQuery): string {
  const params = new URLSearchParams();

  params.set("page", String(query.page ?? 1));
  params.set("per_page", String(query.per_page ?? 50));

  const q = (query.q ?? "").trim();
  if (q) params.set("q", q);

  if (query.status) params.set("status", query.status);

  const s = params.toString();
  return s ? `?${s}` : "";
}

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

function toIntNonNeg(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, Math.trunc(v));
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return fallback;
    const n = Number(s);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.trunc(n));
  }
  return fallback;
}

function normalizeEstado(v: unknown): RecordStatus {
  const s = toStrOrEmpty(v).toUpperCase();
  if (s === "INACTIVO") return "INACTIVO";
  if (s === "SUSPENDIDO") return "SUSPENDIDO";
  return "ACTIVO";
}

function normalizeTipoIafa(x: TipoIafaApi): TipoIafa {
  return {
    id: toIntNonNeg(x.id, 0),
    codigo: toStrOrEmpty(x.codigo),
    descripcion: toStrOrEmpty(x.descripcion),
    estado: normalizeEstado(x.estado),
    created_at: toStrOrNull(x.created_at) ?? undefined,
    updated_at: toStrOrNull(x.updated_at) ?? undefined,
  };
}

export async function listTiposIafas(query: TiposIafasQuery): Promise<PaginatedResponse<TipoIafa>> {
  const res = await api.get<PaginatedResponse<TipoIafaApi>>(`/admision/ficheros/tipos-iafas${buildQuery(query)}`);
  return {
    ...res,
    data: res.data.map(normalizeTipoIafa),
  };
}

export async function createTipoIafa(payload: TipoIafaCreatePayload): Promise<{ data: TipoIafa }> {
  const res = await api.post<{ data: TipoIafaApi }>(`/admision/ficheros/tipos-iafas`, payload);
  return { data: normalizeTipoIafa(res.data) };
}

export async function updateTipoIafa(id: number, payload: TipoIafaUpdatePayload): Promise<{ data: TipoIafa }> {
  const res = await api.put<{ data: TipoIafaApi }>(`/admision/ficheros/tipos-iafas/${id}`, payload);
  return { data: normalizeTipoIafa(res.data) };
}

export async function deactivateTipoIafa(id: number): Promise<{ data: TipoIafa }> {
  const res = await api.patch<{ data: TipoIafaApi }>(`/admision/ficheros/tipos-iafas/${id}/desactivar`);
  return { data: normalizeTipoIafa(res.data) };
}
