import type {
  Paquete,
  PaquetesQuery,
  PaginatedResponse,
  RecordStatus,
  TarifaLookupPaquete,
  TarifaPaqueteResumen,
} from "../types/paquetes.types";
import { api } from "../../../shared/api";
import { buildListQuery } from "../../../shared/datagrid";

export type PaqueteCreatePayload = {
  descripcion: string;
  tarifa_id: number;
  precio_sin_igv: number;
  vigencia_actual: string;
  dias_hospitalizacion: number | null;
  cuenta_contabilidad: string | null;
  estado?: RecordStatus;
};

export type PaqueteUpdatePayload = {
  descripcion: string;
  tarifa_id: number;
  precio_sin_igv: number;
  vigencia_actual: string;
  dias_hospitalizacion: number | null;
  cuenta_contabilidad: string | null;
  estado: RecordStatus;
};

type TarifaApi = {
  id?: unknown;
  codigo?: unknown;
  descripcion_tarifa?: unknown;
};

type PaqueteApi = {
  id: number;
  codigo?: unknown;
  descripcion?: unknown;
  tarifa_id?: unknown;
  tarifa?: unknown;
  precio_sin_igv?: unknown;
  vigencia_actual?: unknown;
  dias_hospitalizacion?: unknown;
  cuenta_contabilidad?: unknown;
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

function toNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.trim().replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function toIntOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, Math.trunc(v));
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "") return null;
    const n = parseInt(t, 10);
    return Number.isFinite(n) ? Math.max(0, n) : null;
  }
  return null;
}

function toTarifaId(v: unknown): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function normalizeTarifaResumen(v: unknown): TarifaPaqueteResumen | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const id = typeof o.id === "number" ? o.id : 0;
  if (!id) return null;
  return {
    id,
    codigo: toStrOrEmpty(o.codigo),
    descripcion_tarifa: toStrOrEmpty(o.descripcion_tarifa),
  };
}

function normalizePaquete(x: PaqueteApi): Paquete {
  return {
    id: x.id,
    codigo: toStrOrEmpty(x.codigo),
    descripcion: toStrOrEmpty(x.descripcion),
    tarifa_id: toTarifaId(x.tarifa_id),
    tarifa: normalizeTarifaResumen(x.tarifa),
    precio_sin_igv: toNum(x.precio_sin_igv),
    vigencia_actual: toStrOrEmpty(x.vigencia_actual).slice(0, 10),
    dias_hospitalizacion: toIntOrNull(x.dias_hospitalizacion),
    cuenta_contabilidad: toStrOrNull(x.cuenta_contabilidad),
    estado: normalizeEstado(x.estado),
    created_at: toStrOrNull(x.created_at) ?? undefined,
    updated_at: toStrOrNull(x.updated_at) ?? undefined,
  };
}

function buildQuery(query: PaquetesQuery): string {
  return buildListQuery({
    page: query.page ?? 1,
    per_page: query.per_page ?? 10,
    q: query.q,
    status: query.status,
    sort: query.sort,
    sort_dir: query.sort_dir,
  });
}

export async function listTarifasOperativasPaquete(): Promise<TarifaLookupPaquete[]> {
  const res = await api.get<{ data: TarifaApi[] }>(`/ficheros/tarifas/operativas`);

  return (res.data ?? [])
    .map((x) => {
      const id = typeof x.id === "number" ? x.id : 0;
      const codigo = toStrOrEmpty(x.codigo);
      const desc = toStrOrEmpty(x.descripcion_tarifa);
      if (!id || !codigo.trim() || !desc.trim()) return null;
      return { id, codigo: codigo.trim(), descripcion_tarifa: desc.trim() };
    })
    .filter((x): x is TarifaLookupPaquete => Boolean(x));
}

export async function getNextPaqueteCodigo(): Promise<{ codigo: string }> {
  const res = await api.get<{ data: { codigo: unknown } }>("/ficheros/paquetes/next-codigo");
  return { codigo: toStrOrEmpty(res.data?.codigo) };
}

export async function listPaquetes(query: PaquetesQuery): Promise<PaginatedResponse<Paquete>> {
  const res = await api.get<PaginatedResponse<PaqueteApi>>(`/ficheros/paquetes${buildQuery(query)}`);
  return { ...res, data: res.data.map(normalizePaquete) };
}

export async function createPaquete(payload: PaqueteCreatePayload): Promise<{ data: Paquete }> {
  const res = await api.post<{ data: PaqueteApi }>(`/ficheros/paquetes`, payload);
  return { data: normalizePaquete(res.data) };
}

export async function updatePaquete(id: number, payload: PaqueteUpdatePayload): Promise<{ data: Paquete }> {
  const res = await api.put<{ data: PaqueteApi }>(`/ficheros/paquetes/${id}`, payload);
  return { data: normalizePaquete(res.data) };
}

export async function deactivatePaquete(id: number): Promise<{ data: Paquete }> {
  const res = await api.patch<{ data: PaqueteApi }>(`/ficheros/paquetes/${id}/desactivar`);
  return { data: normalizePaquete(res.data) };
}
