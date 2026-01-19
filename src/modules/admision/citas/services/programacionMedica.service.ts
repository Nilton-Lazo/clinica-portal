import type { ApiError } from "../../../../shared/api/apiError";
import type { PaginatedResponse } from "../../../../shared/types/pagination";
import type { RecordStatus } from "../../../../shared/types/recordStatus";
import { api } from "../../../../shared/api";

import type {
  ConsultorioLookup,
  CuposResponse,
  EspecialidadLookup,
  MedicoLookup,
  ProgramacionMedica,
  ProgramacionMedicaListFilters,
  ProgramacionMedicaStorePayload,
  ProgramacionMedicaUpdatePayload,
  TurnoLookup,
} from "../types/programacionMedica.types";

import { coerceYmdFromApiDate, padCodigoFromId } from "../utils/programacionMedica.utils";

type ApiPaginatedShape = { data?: unknown; meta?: unknown };
type ApiDataShape = { data?: unknown; meta?: unknown };

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function asString(x: unknown, fallback = ""): string {
  return typeof x === "string" ? x : fallback;
}

function asNumber(x: unknown, fallback = 0): number {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string" && x.trim() !== "") {
    const n = Number(x);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function coerceStatus(x: unknown): RecordStatus {
  const v = String(x ?? "").toUpperCase().trim();
  if (v === "ACTIVO" || v === "INACTIVO" || v === "SUSPENDIDO") return v;
  return "ACTIVO";
}

function coerceTipo(x: unknown): "NORMAL" | "EXTRAORDINARIA" {
  const v = String(x ?? "").toUpperCase().trim();
  return v === "EXTRAORDINARIA" ? "EXTRAORDINARIA" : "NORMAL";
}

function buildQuery(filters: ProgramacionMedicaListFilters): string {
  const p = new URLSearchParams();
  if (filters.page != null) p.set("page", String(filters.page));
  if (filters.per_page != null) p.set("per_page", String(filters.per_page));
  if (filters.status) p.set("status", String(filters.status));
  if (filters.from) p.set("from", String(filters.from));
  if (filters.to) p.set("to", String(filters.to));
  if (filters.q) p.set("q", String(filters.q));
  const s = p.toString();
  return s ? `?${s}` : "";
}

function normalizeEspecialidad(x: unknown): EspecialidadLookup | null {
  if (!isObject(x)) return null;
  return {
    id: asNumber(x.id, 0),
    codigo: asString(x.codigo, ""),
    descripcion: asString(x.descripcion, ""),
    estado: x.estado ? coerceStatus(x.estado) : undefined,
  };
}

function normalizeMedico(x: unknown): MedicoLookup | null {
  if (!isObject(x)) return null;

  const esp = normalizeEspecialidad(x.especialidad);
  const especialidades = Array.isArray(x.especialidades)
    ? x.especialidades.map(normalizeEspecialidad).filter((e): e is EspecialidadLookup => !!e)
    : null;

  return {
    id: asNumber(x.id, 0),
    codigo: typeof x.codigo === "string" ? x.codigo : undefined,
    nombres: asString(x.nombres, ""),
    apellido_paterno: asString(x.apellido_paterno, ""),
    apellido_materno: asString(x.apellido_materno, ""),
    tiempo_promedio_por_paciente:
      typeof x.tiempo_promedio_por_paciente === "number"
        ? x.tiempo_promedio_por_paciente
        : typeof x.tiempo_promedio_por_paciente === "string"
          ? Number(x.tiempo_promedio_por_paciente)
          : null,
    estado: x.estado ? coerceStatus(x.estado) : undefined,
    especialidad_id: x.especialidad_id != null ? asNumber(x.especialidad_id, 0) : undefined,
    especialidad: esp,
    especialidades,
  };
}

function normalizeConsultorio(x: unknown): ConsultorioLookup | null {
  if (!isObject(x)) return null;
  return {
    id: asNumber(x.id, 0),
    abreviatura: asString(x.abreviatura, ""),
    descripcion: asString(x.descripcion, ""),
    estado: x.estado ? coerceStatus(x.estado) : undefined,
  };
}

function normalizeTurno(x: unknown): TurnoLookup | null {
  if (!isObject(x)) return null;
  return {
    id: asNumber(x.id, 0),
    codigo: asString(x.codigo, ""),
    descripcion: asString(x.descripcion, ""),
    duracion_minutos:
      typeof x.duracion_minutos === "number"
        ? x.duracion_minutos
        : typeof x.duracion_minutos === "string"
          ? Number(x.duracion_minutos)
          : null,
    estado: x.estado ? coerceStatus(x.estado) : undefined,
  };
}

function normalizeProgramacion(x: unknown): ProgramacionMedica {
  const o = isObject(x) ? x : {};
  const id = asNumber(o.id, 0);

  const especialidad = normalizeEspecialidad(o.especialidad);
  const medico = normalizeMedico(o.medico);
  const consultorio = normalizeConsultorio(o.consultorio);
  const turno = normalizeTurno(o.turno);

  const fechaRaw = asString(o.fecha, "");
  const fecha = coerceYmdFromApiDate(fechaRaw);

  return {
    id,
    codigo: padCodigoFromId(id),

    fecha,
    cupos: asNumber(o.cupos, 0),
    tipo: coerceTipo(o.tipo),
    estado: coerceStatus(o.estado),

    especialidad,
    medico,
    consultorio,
    turno,

    especialidad_id: asNumber(o.especialidad_id, especialidad?.id ?? 0),
    medico_id: asNumber(o.medico_id, medico?.id ?? 0),
    consultorio_id: asNumber(o.consultorio_id, consultorio?.id ?? 0),
    turno_id: asNumber(o.turno_id, turno?.id ?? 0),

    created_at: typeof o.created_at === "string" ? o.created_at : undefined,
    updated_at: typeof o.updated_at === "string" ? o.updated_at : undefined,
  };
}

function normalizePaginated(x: unknown): PaginatedResponse<ProgramacionMedica> {
  const o: ApiPaginatedShape = isObject(x) ? (x as ApiPaginatedShape) : {};
  const rowsRaw = Array.isArray(o.data) ? o.data : [];
  const metaRaw = isObject(o.meta) ? o.meta : {};

  return {
    data: rowsRaw.map(normalizeProgramacion),
    meta: {
      current_page: asNumber(metaRaw.current_page, 1),
      per_page: asNumber(metaRaw.per_page, 25),
      total: asNumber(metaRaw.total, rowsRaw.length),
      last_page: asNumber(metaRaw.last_page, 1),
    },
  };
}

function normalizeLookupList<T>(x: unknown, normalizeOne: (v: unknown) => T | null): T[] {
  const o = isObject(x) ? x : {};
  const dataRaw = isObject(o) ? o.data : [];
  const rows = Array.isArray(dataRaw) ? dataRaw : [];
  return rows.map(normalizeOne).filter((v): v is T => !!v);
}

function coerceNextIdFromResponse(res: unknown): number {
  const o: ApiDataShape = isObject(res) ? (res as ApiDataShape) : {};
  const d = isObject(o.data) ? o.data : (isObject(res) ? res : {});
  const x = d as Record<string, unknown>;
  return asNumber(x.next_id ?? x.nextId ?? x.id ?? x.value, 0);
}

export function programacionMedicaService() {
  return {
    async list(filters: ProgramacionMedicaListFilters): Promise<PaginatedResponse<ProgramacionMedica>> {
      const res = await api.get<unknown>(`/admision/citas/programacion-medica${buildQuery(filters)}`);
      return normalizePaginated(res);
    },

    async nextCodigo(): Promise<number> {
      const res = await api.get<unknown>(`/admision/citas/programacion-medica/next-codigo`);
      return coerceNextIdFromResponse(res);
    },

    async createBatch(payload: ProgramacionMedicaStorePayload): Promise<ProgramacionMedica[]> {
      const res = await api.post<unknown>(`/admision/citas/programacion-medica`, payload);
      const o: ApiDataShape = isObject(res) ? (res as ApiDataShape) : {};
      const arr = Array.isArray(o.data) ? o.data : [];
      return arr.map(normalizeProgramacion);
    },

    async update(id: number, payload: ProgramacionMedicaUpdatePayload): Promise<ProgramacionMedica> {
      const res = await api.request<unknown>({
        method: "PUT",
        path: `/admision/citas/programacion-medica/${id}`,
        body: payload,
      });
      const o: ApiDataShape = isObject(res) ? (res as ApiDataShape) : {};
      return normalizeProgramacion(o.data);
    },

    async deactivate(id: number): Promise<ProgramacionMedica> {
      const res = await api.request<unknown>({
        method: "PATCH",
        path: `/admision/citas/programacion-medica/${id}/desactivar`,
        body: {},
      });
      const o: ApiDataShape = isObject(res) ? (res as ApiDataShape) : {};
      return normalizeProgramacion(o.data);
    },

    async cupos(medicoId: number, turnoId: number): Promise<CuposResponse> {
      const qs = new URLSearchParams({ medico_id: String(medicoId), turno_id: String(turnoId) }).toString();
      const res = await api.get<unknown>(`/admision/citas/programacion-medica/cupos?${qs}`);
      const o: ApiDataShape = isObject(res) ? (res as ApiDataShape) : {};
      const d = isObject(o.data) ? o.data : {};
      return {
        cupos: asNumber((d as Record<string, unknown>).cupos, 0),
        duracion_minutos: asNumber((d as Record<string, unknown>).duracion_minutos, 0),
        tiempo_promedio_por_paciente: asNumber((d as Record<string, unknown>).tiempo_promedio_por_paciente, 0),
      };
    },

    async listMedicosActivos(): Promise<MedicoLookup[]> {
      const qs = new URLSearchParams({ status: "ACTIVO", per_page: "100", page: "1" }).toString();
      const res = await api.get<unknown>(`/admision/ficheros/medicos?${qs}`);
      return normalizeLookupList<MedicoLookup>(res, normalizeMedico);
    },

    async listEspecialidadesActivas(): Promise<EspecialidadLookup[]> {
      const qs = new URLSearchParams({ status: "ACTIVO", per_page: "100", page: "1" }).toString();
      const res = await api.get<unknown>(`/admision/ficheros/especialidades?${qs}`);
      return normalizeLookupList<EspecialidadLookup>(res, normalizeEspecialidad);
    },

    async listConsultoriosActivos(): Promise<ConsultorioLookup[]> {
      const qs = new URLSearchParams({ status: "ACTIVO", per_page: "100", page: "1" }).toString();
      const res = await api.get<unknown>(`/admision/ficheros/consultorios?${qs}`);
      return normalizeLookupList<ConsultorioLookup>(res, normalizeConsultorio);
    },

    async listTurnosActivos(): Promise<TurnoLookup[]> {
      const qs = new URLSearchParams({ status: "ACTIVO", per_page: "100", page: "1" }).toString();
      const res = await api.get<unknown>(`/admision/ficheros/turnos?${qs}`);
      return normalizeLookupList<TurnoLookup>(res, normalizeTurno);
    },
  };
}

export function isApiError(e: unknown): e is ApiError {
  return isObject(e) && typeof (e as Record<string, unknown>).kind === "string";
}
