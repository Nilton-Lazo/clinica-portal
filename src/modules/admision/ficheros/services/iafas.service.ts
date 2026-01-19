import type { Iafa, IafasQuery, PaginatedResponse, RecordStatus, TipoIafaLookup } from "../types/iafas.types";
import { api } from "../../../../shared/api";

export type IafaCreatePayload = {
  tipo_iafa_id: number;

  razon_social: string;
  descripcion_corta: string;
  ruc: string;

  direccion: string | null;
  representante_legal: string | null;
  telefono: string | null;
  pagina_web: string | null;

  fecha_inicio_cobertura: string;
  fecha_fin_cobertura: string;

  estado?: RecordStatus;
};

export type IafaUpdatePayload = {
  tipo_iafa_id: number;

  razon_social: string;
  descripcion_corta: string;
  ruc: string;

  direccion: string | null;
  representante_legal: string | null;
  telefono: string | null;
  pagina_web: string | null;

  fecha_inicio_cobertura: string;
  fecha_fin_cobertura: string;

  estado: RecordStatus;
};

type TipoIafaApi = {
  id: number;
  codigo?: unknown;
  descripcion?: unknown;
};

type IafaApi = {
  id: number;

  codigo?: unknown;

  tipo_iafa_id?: unknown;
  tipo?: unknown;

  razon_social?: unknown;
  descripcion_corta?: unknown;
  ruc?: unknown;

  direccion?: unknown;
  representante_legal?: unknown;
  telefono?: unknown;
  pagina_web?: unknown;

  fecha_inicio_cobertura?: unknown;
  fecha_fin_cobertura?: unknown;

  estado?: unknown;

  created_at?: unknown;
  updated_at?: unknown;
};

export async function getNextIafaCodigo(): Promise<{ codigo: string }> {
  const res = await api.get<{ data: { codigo: unknown } }>("/admision/ficheros/iafas/next-codigo");
  return { codigo: toStrOrEmpty(res.data?.codigo) };
}

function buildQuery(query: IafasQuery): string {
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

function normalizeTipoIafa(x: unknown): Iafa["tipo"] {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const id = toIntNonNeg(o.id, 0);
  if (!id) return null;
  return { id, codigo: toStrOrEmpty(o.codigo), descripcion: toStrOrEmpty(o.descripcion) };
}

function normalizeDateIso(v: unknown): string {
  const s = toStrOrEmpty(v);
  return s.length >= 10 ? s.slice(0, 10) : "";
}

function normalizeIafa(x: IafaApi): Iafa {
  const tipo = normalizeTipoIafa(x.tipo);

  const fechaInicio = normalizeDateIso(x.fecha_inicio_cobertura);
  const fechaFin = normalizeDateIso(x.fecha_fin_cobertura);

  return {
    id: x.id,

    codigo: toStrOrEmpty(x.codigo),

    tipo_iafa_id: toIntNonNeg(x.tipo_iafa_id, tipo?.id ?? 0),
    tipo,

    razon_social: toStrOrEmpty(x.razon_social),
    descripcion_corta: toStrOrEmpty(x.descripcion_corta),
    ruc: toStrOrEmpty(x.ruc),

    direccion: toStrOrNull(x.direccion),
    representante_legal: toStrOrNull(x.representante_legal),
    telefono: toStrOrNull(x.telefono),
    pagina_web: toStrOrNull(x.pagina_web),

    fecha_inicio_cobertura: fechaInicio,
    fecha_fin_cobertura: fechaFin,

    estado: normalizeEstado(x.estado),

    created_at: toStrOrNull(x.created_at) ?? undefined,
    updated_at: toStrOrNull(x.updated_at) ?? undefined,
  };
}

export async function listIafas(query: IafasQuery): Promise<PaginatedResponse<Iafa>> {
  const res = await api.get<PaginatedResponse<IafaApi>>(`/admision/ficheros/iafas${buildQuery(query)}`);
  return {
    ...res,
    data: res.data.map(normalizeIafa),
  };
}

export async function createIafa(payload: IafaCreatePayload): Promise<{ data: Iafa }> {
  const res = await api.post<{ data: IafaApi }>(`/admision/ficheros/iafas`, payload);
  return { data: normalizeIafa(res.data) };
}

export async function updateIafa(id: number, payload: IafaUpdatePayload): Promise<{ data: Iafa }> {
  const res = await api.put<{ data: IafaApi }>(`/admision/ficheros/iafas/${id}`, payload);
  return { data: normalizeIafa(res.data) };
}

export async function deactivateIafa(id: number): Promise<{ data: Iafa }> {
  const res = await api.patch<{ data: IafaApi }>(`/admision/ficheros/iafas/${id}/desactivar`);
  return { data: normalizeIafa(res.data) };
}

export async function listTiposIafasLookup(): Promise<TipoIafaLookup[]> {
  const res = await api.get<{
    data: TipoIafaApi[];
    meta: { current_page: number; per_page: number; total: number; last_page: number };
  }>(`/admision/ficheros/tipos-iafas?page=1&per_page=100&status=ACTIVO`);

  return (res.data ?? [])
    .map((x) => ({
      id: x.id,
      codigo: toStrOrEmpty(x.codigo),
      descripcion: toStrOrEmpty(x.descripcion),
    }))
    .filter((x) => x.id > 0 && x.codigo.trim() !== "" && x.descripcion.trim() !== "");
}
