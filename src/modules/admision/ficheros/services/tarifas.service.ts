import type { IafaLookup, PaginatedResponse, RecordStatus, Tarifa, TarifasQuery, TipoIafaLookup } from "../types/tarifas.types";
import { api } from "../../../../shared/api";

export type TarifaCreatePayload = {
  requiere_acreditacion: boolean;
  tarifa_base: boolean;

  descripcion_tarifa: string;

  iafa_id: number | null;

  factor_clinica?: number;
  factor_laboratorio?: number;
  factor_ecografia?: number;
  factor_procedimientos?: number;
  factor_rayos_x?: number;
  factor_tomografia?: number;
  factor_patologia?: number;
  factor_medicina_fisica?: number;
  factor_resonancia?: number;
  factor_honorarios_medicos?: number;
  factor_medicinas?: number;
  factor_equipos_oxigeno?: number;
  factor_banco_sangre?: number;
  factor_mamografia?: number;
  factor_densitometria?: number;
  factor_psicoprofilaxis?: number;
  factor_otros_servicios?: number;

  factor_medicamentos_comerciales?: number;
  factor_medicamentos_genericos?: number;
  factor_material_medico?: number;

  estado?: RecordStatus;
};

export type TarifaUpdatePayload = {
  requiere_acreditacion: boolean;
  tarifa_base: boolean;

  descripcion_tarifa: string;

  iafa_id: number | null;

  factor_clinica?: number;
  factor_laboratorio?: number;
  factor_ecografia?: number;
  factor_procedimientos?: number;
  factor_rayos_x?: number;
  factor_tomografia?: number;
  factor_patologia?: number;
  factor_medicina_fisica?: number;
  factor_resonancia?: number;
  factor_honorarios_medicos?: number;
  factor_medicinas?: number;
  factor_equipos_oxigeno?: number;
  factor_banco_sangre?: number;
  factor_mamografia?: number;
  factor_densitometria?: number;
  factor_psicoprofilaxis?: number;
  factor_otros_servicios?: number;

  factor_medicamentos_comerciales?: number;
  factor_medicamentos_genericos?: number;
  factor_material_medico?: number;

  estado: RecordStatus;
};

type TarifaApi = {
  id: number;

  codigo?: unknown;

  requiere_acreditacion?: unknown;
  tarifa_base?: unknown;

  descripcion_tarifa?: unknown;

  iafa_id?: unknown;

  factor_clinica?: unknown;
  factor_laboratorio?: unknown;
  factor_ecografia?: unknown;
  factor_procedimientos?: unknown;
  factor_rayos_x?: unknown;
  factor_tomografia?: unknown;
  factor_patologia?: unknown;
  factor_medicina_fisica?: unknown;
  factor_resonancia?: unknown;
  factor_honorarios_medicos?: unknown;
  factor_medicinas?: unknown;
  factor_equipos_oxigeno?: unknown;
  factor_banco_sangre?: unknown;
  factor_mamografia?: unknown;
  factor_densitometria?: unknown;
  factor_psicoprofilaxis?: unknown;
  factor_otros_servicios?: unknown;

  factor_medicamentos_comerciales?: unknown;
  factor_medicamentos_genericos?: unknown;
  factor_material_medico?: unknown;

  fecha_creacion?: unknown;

  estado?: unknown;

  created_at?: unknown;
  updated_at?: unknown;
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
  razon_social?: unknown;
  descripcion_corta?: unknown;
  ruc?: unknown;
  estado?: unknown;
};

export async function getNextTarifaCodigo(): Promise<{ codigo: string }> {
  const res = await api.get<{ data: { codigo: unknown } }>("/admision/ficheros/tarifas/next-codigo");
  return { codigo: toStrOrEmpty(res.data?.codigo) };
}

function buildQuery(query: TarifasQuery): string {
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

function toBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes" || s === "on") return true;
    if (s === "false" || s === "0" || s === "no" || s === "off") return false;
  }
  return fallback;
}

function normalizeEstado(v: unknown): RecordStatus {
  const s = toStrOrEmpty(v).toUpperCase();
  if (s === "INACTIVO") return "INACTIVO";
  if (s === "SUSPENDIDO") return "SUSPENDIDO";
  return "ACTIVO";
}

function normalizeDateIso(v: unknown): string {
  const s = toStrOrEmpty(v);
  return s.length >= 10 ? s.slice(0, 10) : "";
}

function toDecimal2Str(v: unknown, fallback: string): string {
  if (typeof v === "number" && Number.isFinite(v)) return v.toFixed(2);
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return fallback;
    const n = Number(t);
    if (!Number.isFinite(n)) return fallback;
    return n.toFixed(2);
  }
  return fallback;
}

function normalizeTarifa(x: TarifaApi): Tarifa {
  return {
    id: x.id,

    codigo: toStrOrEmpty(x.codigo),

    requiere_acreditacion: toBool(x.requiere_acreditacion, true),
    tarifa_base: toBool(x.tarifa_base, false),

    descripcion_tarifa: toStrOrEmpty(x.descripcion_tarifa),

    iafa_id: (() => {
      const n = toIntNonNeg(x.iafa_id, 0);
      return n > 0 ? n : null;
    })(),

    factor_clinica: toDecimal2Str(x.factor_clinica, "1.00"),
    factor_laboratorio: toDecimal2Str(x.factor_laboratorio, "1.00"),
    factor_ecografia: toDecimal2Str(x.factor_ecografia, "1.00"),
    factor_procedimientos: toDecimal2Str(x.factor_procedimientos, "1.00"),
    factor_rayos_x: toDecimal2Str(x.factor_rayos_x, "1.00"),
    factor_tomografia: toDecimal2Str(x.factor_tomografia, "1.00"),
    factor_patologia: toDecimal2Str(x.factor_patologia, "1.00"),
    factor_medicina_fisica: toDecimal2Str(x.factor_medicina_fisica, "1.00"),
    factor_resonancia: toDecimal2Str(x.factor_resonancia, "1.00"),
    factor_honorarios_medicos: toDecimal2Str(x.factor_honorarios_medicos, "1.00"),
    factor_medicinas: toDecimal2Str(x.factor_medicinas, "1.00"),
    factor_equipos_oxigeno: toDecimal2Str(x.factor_equipos_oxigeno, "1.00"),
    factor_banco_sangre: toDecimal2Str(x.factor_banco_sangre, "1.00"),
    factor_mamografia: toDecimal2Str(x.factor_mamografia, "1.00"),
    factor_densitometria: toDecimal2Str(x.factor_densitometria, "1.00"),
    factor_psicoprofilaxis: toDecimal2Str(x.factor_psicoprofilaxis, "1.00"),
    factor_otros_servicios: toDecimal2Str(x.factor_otros_servicios, "1.00"),

    factor_medicamentos_comerciales: toDecimal2Str(x.factor_medicamentos_comerciales, "1.00"),
    factor_medicamentos_genericos: toDecimal2Str(x.factor_medicamentos_genericos, "1.00"),
    factor_material_medico: toDecimal2Str(x.factor_material_medico, "1.00"),

    fecha_creacion: normalizeDateIso(x.fecha_creacion),

    estado: normalizeEstado(x.estado),

    created_at: toStrOrNull(x.created_at) ?? undefined,
    updated_at: toStrOrNull(x.updated_at) ?? undefined,
  };
}

export async function listTarifas(query: TarifasQuery): Promise<PaginatedResponse<Tarifa>> {
  const res = await api.get<PaginatedResponse<TarifaApi>>(`/admision/ficheros/tarifas${buildQuery(query)}`);
  return {
    ...res,
    data: res.data.map(normalizeTarifa),
  };
}

export async function createTarifa(payload: TarifaCreatePayload): Promise<{ data: Tarifa }> {
  const res = await api.post<{ data: TarifaApi }>(`/admision/ficheros/tarifas`, payload);
  return { data: normalizeTarifa(res.data) };
}

export async function updateTarifa(id: number, payload: TarifaUpdatePayload): Promise<{ data: Tarifa }> {
  const res = await api.put<{ data: TarifaApi }>(`/admision/ficheros/tarifas/${id}`, payload);
  return { data: normalizeTarifa(res.data) };
}

export async function deactivateTarifa(id: number): Promise<{ data: Tarifa }> {
  const res = await api.patch<{ data: TarifaApi }>(`/admision/ficheros/tarifas/${id}/desactivar`);
  return { data: normalizeTarifa(res.data) };
}

export async function setBaseTarifa(id: number): Promise<{ data: Tarifa }> {
  const res = await api.patch<{ data: TarifaApi }>(`/admision/ficheros/tarifas/${id}/marcar-base`);
  return { data: normalizeTarifa(res.data) };
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

function normalizeIafaLookup(x: IafaApi): IafaLookup | null {
  const id = x.id;
  if (!id || id <= 0) return null;

  const estado = normalizeEstado(x.estado);
  if (estado !== "ACTIVO") return null;

  return {
    id,
    codigo: toStrOrEmpty(x.codigo),
    tipo_iafa_id: toIntNonNeg(x.tipo_iafa_id, 0),
    razon_social: toStrOrEmpty(x.razon_social),
    descripcion_corta: toStrOrEmpty(x.descripcion_corta),
    ruc: toStrOrEmpty(x.ruc),
  };
}

export async function listIafasLookupAllActive(): Promise<IafaLookup[]> {
  const out: IafaLookup[] = [];

  let page = 1;
  let lastPage = 1;

  const maxPages = 25;

  for (let i = 0; i < maxPages; i++) {
    const res = await api.get<{
      data: IafaApi[];
      meta: { current_page: number; per_page: number; total: number; last_page: number };
    }>(`/admision/ficheros/iafas?page=${page}&per_page=100&status=ACTIVO`);

    const rows = (res.data ?? []).map(normalizeIafaLookup).filter((x): x is IafaLookup => Boolean(x));

    out.push(...rows);

    lastPage = toIntNonNeg(res.meta?.last_page, 1);
    const currentPage = toIntNonNeg(res.meta?.current_page, page);

    if (currentPage >= lastPage) break;

    page = currentPage + 1;
  }

  return out.sort((a, b) => {
    const na = Number(a.codigo);
    const nb = Number(b.codigo);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.codigo.localeCompare(b.codigo);
  });
}
