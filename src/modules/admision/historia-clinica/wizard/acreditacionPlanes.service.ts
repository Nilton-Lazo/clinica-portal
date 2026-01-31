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
};

type PlanApi = {
  id: number;
  tipo_cliente_id?: unknown;
  tipo_cliente?: unknown;
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

  return {
    id: x.id,
    tipo_cliente_id: toIntNonNeg(x.tipo_cliente_id, tipo?.id ?? 0),
    tipo_cliente: tipo,
    parentesco_seguro: normalizeParentesco(x.parentesco_seguro),
    fecha_afiliacion: toStrOrNull(x.fecha_afiliacion),
    estado: normalizeEstado(x.estado),
  };
}

export async function listTiposClientesLookup(): Promise<TipoClienteLookup[]> {
  const res = await api.get<{
    data: TipoClienteApi[];
    meta: { current_page: number; per_page: number; total: number; last_page: number };
  }>(`/admision/ficheros/tipos-clientes?page=1&per_page=100&status=ACTIVO`);

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
  }>(`/admision/ficheros/iafas?page=1&per_page=200&status=ACTIVO`);

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
  }>(`/admision/ficheros/contratantes?page=1&per_page=200&status=ACTIVO`);

  return (res.data ?? [])
    .map((x) => ({
      id: x.id,
      codigo: toStrOrEmpty(x.codigo),
      razon_social: toStrOrEmpty(x.razon_social),
    }))
    .filter((x) => x.id > 0 && (x.razon_social.trim() || x.codigo.trim()));
}

export async function listPacientePlanes(pacienteId: number): Promise<AcreditacionPlan[]> {
  const res = await pacienteService.show(pacienteId);
  const data = res.data as unknown;

  const planesUnknown = isObject(data) ? (data.planes as unknown) : null;
  if (!Array.isArray(planesUnknown)) return [];

  return (planesUnknown as PlanApi[])
    .filter((x) => x && typeof x === "object" && typeof (x as { id?: unknown }).id === "number")
    .map((x) => normalizePlan(x));
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

export async function deactivatePacientePlan(pacienteId: number, planId: number): Promise<{ data: AcreditacionPlan }> {
  const res = await api.patch<{ data: PlanApi }>(`/admision/pacientes/planes/${planId}/desactivar`);
  return { data: normalizePlan(res.data) };
}
