import type {
    JornadaTurno,
    PaginatedResponse,
    RecordStatus,
    TipoTurno,
    Turno,
    TurnosQuery,
  } from "../types/turnos.types";
  
  import { api } from "../../../../shared/api";
  
  export type TurnoCreatePayload = {
    hora_inicio: string;
    hora_fin: string;
    tipo_turno: TipoTurno;
    jornada: JornadaTurno;
    estado?: RecordStatus;
    descripcion?: string;
  };
  
  export type TurnoUpdatePayload = {
    hora_inicio: string;
    hora_fin: string;
    tipo_turno: TipoTurno;
    jornada: JornadaTurno;
    estado: RecordStatus;
    descripcion?: string;
  };
  
  type TurnoApi = {
    id: number;
  
    codigo?: unknown;
  
    hora_inicio?: unknown;
    hora_fin?: unknown;
  
    duracion_minutos?: unknown;
    duracion_hhmm?: unknown;
  
    descripcion?: unknown;
  
    tipo_turno?: unknown;
    jornada?: unknown;
  
    estado?: unknown;
  
    created_at?: unknown;
    updated_at?: unknown;
  };
  
  function buildQuery(query: TurnosQuery): string {
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
  
  function normalizeTipoTurno(v: unknown): TipoTurno {
    const s = toStrOrEmpty(v).toUpperCase();
    if (s === "ADICIONAL") return "ADICIONAL";
    if (s === "EXCLUSIVO") return "EXCLUSIVO";
    return "NORMAL";
  }
  
  function normalizeJornada(v: unknown): JornadaTurno {
    const s = toStrOrEmpty(v).toUpperCase();
    if (s === "TARDE") return "TARDE";
    if (s === "NOCHE") return "NOCHE";
    return "MANANA";
  }
  
  function normalizeHora(v: unknown): string | null {
    const s = toStrOrNull(v);
    if (!s) return null;
    const t = s.trim();
    if (t.length >= 5) return t.slice(0, 5);
    return t;
  }
  
  function normalizeTurno(x: TurnoApi): Turno {
    return {
      id: x.id,
  
      codigo: toStrOrEmpty(x.codigo),
  
      hora_inicio: normalizeHora(x.hora_inicio),
      hora_fin: normalizeHora(x.hora_fin),
  
      duracion_minutos: toIntNonNeg(x.duracion_minutos, 0),
      duracion_hhmm: toStrOrNull(x.duracion_hhmm) ?? undefined,
  
      descripcion: toStrOrEmpty(x.descripcion),
  
      tipo_turno: normalizeTipoTurno(x.tipo_turno),
      jornada: normalizeJornada(x.jornada),
  
      estado: normalizeEstado(x.estado),
  
      created_at: toStrOrNull(x.created_at) ?? undefined,
      updated_at: toStrOrNull(x.updated_at) ?? undefined,
    };
  }
  
  export async function getNextTurnoCodigo(): Promise<{ codigo: string }> {
    const res = await api.get<{ data: { codigo: unknown } }>(`/admision/ficheros/turnos/next-codigo`);
    return { codigo: toStrOrEmpty(res.data?.codigo) };
  }
  
  export async function listTurnos(query: TurnosQuery): Promise<PaginatedResponse<Turno>> {
    const res = await api.get<PaginatedResponse<TurnoApi>>(`/admision/ficheros/turnos${buildQuery(query)}`);
    return {
      ...res,
      data: res.data.map(normalizeTurno),
    };
  }
  
  export async function createTurno(payload: TurnoCreatePayload): Promise<{ data: Turno }> {
    const res = await api.post<{ data: TurnoApi }>(`/admision/ficheros/turnos`, payload);
    return { data: normalizeTurno(res.data) };
  }
  
  export async function updateTurno(id: number, payload: TurnoUpdatePayload): Promise<{ data: Turno }> {
    const res = await api.request<{ data: TurnoApi }>({
      method: "PUT",
      path: `/admision/ficheros/turnos/${id}`,
      body: payload,
    });
    return { data: normalizeTurno(res.data) };
  }
  
  export async function deactivateTurno(id: number): Promise<{ data: Turno }> {
    const res = await api.request<{ data: TurnoApi }>({
      method: "PATCH",
      path: `/admision/ficheros/turnos/${id}/desactivar`,
    });
    return { data: normalizeTurno(res.data) };
  }
  