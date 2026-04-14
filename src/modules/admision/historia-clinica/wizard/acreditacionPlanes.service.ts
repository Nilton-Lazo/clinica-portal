import { api } from "../../../../shared/api";
import type {
  AcreditacionPlan,
  ParentescoSeguro,
  RecordStatus,
  TipoClienteLookup,
  IafaLookup,
  ContratanteLookup,
} from "./acreditacionPlanes.types";
import { pacienteService } from "./paciente.service";

type TipoClienteApi = {
  id: number;
  codigo?: unknown;
  descripcion_tipo_cliente?: unknown;
  iafa_id?: unknown;
  contratante_id?: unknown;
  tarifa?: {
    id?: unknown;
    es_precio_directo?: unknown;
    codigo?: unknown;
    descripcion?: unknown;
    tarifa_id?: unknown;
    tarifa_codigo?: unknown;
    tarifa_descripcion?: unknown;
  };
};

type PlanApi = {
  id: number;
  tipo_cliente_id?: unknown;
  tipo_cliente?: TipoClienteApi;
  parentesco_seguro?: unknown;
  fecha_afiliacion?: unknown;
  estado?: unknown;
};

type IafaApi = {
  id: number;
  codigo?: unknown;
  razon_social?: unknown;
  descripcion_corta?: unknown;
};

type ContratanteApi = {
  id: number;
  codigo?: unknown;
  razon_social?: unknown;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function toStrOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    const s = v.trim();
    return s ? s : null;
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

function toIntOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    return Math.trunc(n);
  }
  return null;
}

function normalizeEstado(v: unknown): RecordStatus {
  const s = toStrOrEmpty(v).toUpperCase();
  if (s === "INACTIVO") return "INACTIVO";
  if (s === "SUSPENDIDO") return "SUSPENDIDO";
  return "ACTIVO";
}

function normalizeParentesco(v: unknown): ParentescoSeguro | null {
  const s = toStrOrEmpty(v).toUpperCase();
  if (s === "TITULAR") return "TITULAR";
  if (s === "CONYUGE") return "CONYUGE";
  if (s === "HIJO") return "HIJO";
  if (s === "PADRE") return "PADRE";
  if (s === "MADRE") return "MADRE";
  if (s === "OTRO") return "OTRO";
  return null;
}

function normalizeTipoCliente(x: unknown): TipoClienteLookup | null {
  if (!isObject(x)) return null;
  const id = toIntNonNeg(x.id, 0);
  if (!id) return null;

  return {
    id,
    codigo: toStrOrEmpty(x.codigo),
    descripcion_tipo_cliente: toStrOrEmpty(x.descripcion_tipo_cliente),
    iafa_id: toIntOrNull((x as Record<string, unknown>).iafa_id),
    contratante_id: toIntOrNull((x as Record<string, unknown>).contratante_id),
  };
}

function normalizePlan(x: PlanApi): AcreditacionPlan {
  const tipo = normalizeTipoCliente(x.tipo_cliente);
  const xAny = x as unknown as Record<string, unknown>;
  const tipoClienteAny = (x.tipo_cliente ?? undefined) as unknown as Record<string, unknown> | undefined;

  const tarifaNested =
    isObject(x.tipo_cliente) && isObject((x.tipo_cliente as Record<string, unknown>).tarifa)
      ? (x.tipo_cliente as TipoClienteApi).tarifa
      : undefined;

  const tarifaSource: Record<string, unknown> | undefined =
    (tarifaNested as Record<string, unknown> | undefined) ??
    (tipoClienteAny?.tarifa as Record<string, unknown> | undefined) ??
    (isObject(xAny.tarifa) ? (xAny.tarifa as Record<string, unknown>) : undefined) ??
    undefined;

  const tarifaEsPrecioDirecto =
    (tarifaSource && typeof (tarifaSource as { es_precio_directo?: unknown }).es_precio_directo === "boolean"
      ? (tarifaSource as { es_precio_directo: boolean }).es_precio_directo
      : typeof (tipoClienteAny?.tarifa_es_precio_directo as unknown) === "boolean"
        ? (tipoClienteAny?.tarifa_es_precio_directo as boolean)
        : typeof (xAny.tarifa_es_precio_directo as unknown) === "boolean"
          ? (xAny.tarifa_es_precio_directo as boolean)
          : false) ?? false;

  const tarifaId =
    (tarifaSource && (toIntOrNull(tarifaSource.tarifa_id ?? tarifaSource.id) ?? null)) ??
    (typeof tipoClienteAny?.tarifa_id === "string" || typeof tipoClienteAny?.tarifa_id === "number"
      ? toIntOrNull(tipoClienteAny.tarifa_id as unknown) ?? null
      : null) ??
    (typeof xAny.tarifa_id === "string" || typeof xAny.tarifa_id === "number" ? toIntOrNull(xAny.tarifa_id as unknown) : null) ??
    null;

  const tarifaCodigo =
    toStrOrNull(
      (tarifaSource?.codigo as unknown) ??
        (tarifaSource?.tarifa_codigo as unknown) ??
        ((tipoClienteAny as Record<string, unknown> | undefined)?.tarifa_codigo as unknown) ??
        (xAny.tarifa_codigo as unknown) ??
        null
    ) ?? null;

  const tarifaDescripcion =
    toStrOrNull(
      (tarifaSource?.descripcion as unknown) ??
        tarifaSource?.tarifa_descripcion ??
        (tarifaSource as any)?.descripcion_tarifa ??
        ((tarifaSource as any)?.descripcion_tarifa ?? null) ??
        (tarifaSource as any)?.descripcion_corta ??
        ((tipoClienteAny as Record<string, unknown> | undefined)?.tarifa_descripcion as unknown) ??
        ((tipoClienteAny as Record<string, unknown> | undefined)?.descripcion_corta as unknown) ??
        xAny.tarifa_descripcion ??
        xAny.descripcion_corta ??
        null
    ) ?? null;

  return {
    id: x.id,
    tipo_cliente_id: toIntNonNeg(x.tipo_cliente_id, tipo?.id ?? 0),
    tipo_cliente: tipo,
    parentesco_seguro: normalizeParentesco(x.parentesco_seguro),
    fecha_afiliacion: toStrOrNull(x.fecha_afiliacion),
    estado: normalizeEstado(x.estado),
    tarifa_es_precio_directo: tarifaEsPrecioDirecto,
    tarifa_id: tarifaId,
    tarifa_codigo: tarifaCodigo,
    tarifa_descripcion: tarifaDescripcion,
  };
}

export async function listTiposClientesLookup(): Promise<TipoClienteLookup[]> {
  const res = await api.get<{
    data: TipoClienteApi[];
    meta: { current_page: number; per_page: number; total: number; last_page: number };
  }>(`/ficheros/tipos-clientes?page=1&per_page=100&status=ACTIVO`);

  return (res.data ?? [])
    .map((x) => ({
      id: x.id,
      codigo: toStrOrEmpty(x.codigo),
      descripcion_tipo_cliente: toStrOrEmpty(x.descripcion_tipo_cliente),
      iafa_id: toIntOrNull(x.iafa_id),
      contratante_id: toIntOrNull(x.contratante_id),
    }))
    .filter((x) => x.id > 0 && (x.codigo.trim() || x.descripcion_tipo_cliente.trim()));
}

export async function listIafasLookup(): Promise<IafaLookup[]> {
  const res = await api.get<{
    data: IafaApi[];
    meta: { current_page: number; per_page: number; total: number; last_page: number };
  }>(`/ficheros/iafas?page=1&per_page=200&status=ACTIVO`);

  return (res.data ?? [])
    .map((x) => ({
      id: x.id,
      codigo: toStrOrEmpty(x.codigo),
      razon_social: toStrOrEmpty(x.razon_social),
      descripcion_corta: toStrOrEmpty(x.descripcion_corta),
    }))
    .filter((x) => x.id > 0 && (x.razon_social.trim() || x.descripcion_corta.trim() || x.codigo.trim()));
}

export async function listContratantesLookup(): Promise<ContratanteLookup[]> {
  const res = await api.get<{
    data: ContratanteApi[];
    meta: { current_page: number; per_page: number; total: number; last_page: number };
  }>(`/ficheros/contratantes?page=1&per_page=200&status=ACTIVO`);

  return (res.data ?? [])
    .map((x) => ({
      id: x.id,
      codigo: toStrOrEmpty(x.codigo),
      razon_social: toStrOrEmpty(x.razon_social),
    }))
    .filter((x) => x.id > 0 && (x.razon_social.trim() || x.codigo.trim()));
}

export type ListPacientePlanesOpts = {
  soloActivos?: boolean;
  incluirPlanId?: number | null;
};

export async function listPacientePlanes(
  pacienteId: number,
  opts?: ListPacientePlanesOpts
): Promise<AcreditacionPlan[]> {
  const res = await pacienteService.show(pacienteId);
  const data = res.data as unknown;

  const planesUnknown = isObject(data) ? (data.planes as unknown) : null;
  if (!Array.isArray(planesUnknown)) return [];

  const mapped = (planesUnknown as PlanApi[])
    .filter((x) => x && typeof x === "object" && typeof (x as { id?: unknown }).id === "number")
    .map((x) => normalizePlan(x));

  if (!opts?.soloActivos) return mapped;

  const activos = mapped.filter((p) => p.estado === "ACTIVO");
  const extraId = opts.incluirPlanId;
  if (extraId == null || Number.isNaN(extraId)) return activos;

  const extra = mapped.find((p) => p.id === extraId);
  if (!extra) return activos;
  if (activos.some((a) => a.id === extra.id)) return activos;
  return [...activos, extra];
}

export type PlanCreatePayload = {
  tipo_cliente_id: number;
  fecha_afiliacion: string | null;
  estado: RecordStatus;
};

export type PlanUpdatePayload = PlanCreatePayload;

function planesBase(pacienteId: number) {
  return `/admision/pacientes/${pacienteId}/planes`;
}

export async function createPacientePlan(pacienteId: number, payload: PlanCreatePayload): Promise<{ data: AcreditacionPlan }> {
  const res = await api.post<{ data: PlanApi }>(planesBase(pacienteId), payload);
  return { data: normalizePlan(res.data) };
}

export async function updatePacientePlan(
  pacienteId: number,
  planId: number,
  payload: PlanUpdatePayload
): Promise<{ data: AcreditacionPlan }> {
  const res = await api.put<{ data: PlanApi }>(`${planesBase(pacienteId)}/${planId}`, payload);
  return { data: normalizePlan(res.data) };
}

export async function deactivatePacientePlan(_pacienteId: number, planId: number): Promise<{ data: AcreditacionPlan }> {
  const res = await api.patch<{ data: PlanApi }>(`/admision/pacientes/planes/${planId}/desactivar`);
  return { data: normalizePlan(res.data) };
}
