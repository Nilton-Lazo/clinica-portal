import type {
    EspecialidadLookup,
    Medico,
    MedicosQuery,
    PaginatedResponse,
    RecordStatus,
    TipoProfesionalClinica,
  } from "../types/medicos.types";
  
  import { api } from "../../../../shared/api";
  
  export type MedicoCreatePayload = {
    cmp: string | null;
    rne: string | null;
    dni: string | null;
  
    tipo_profesional_clinica: TipoProfesionalClinica;
  
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
  
    direccion: string | null;
    centro_trabajo: string | null;
    fecha_nacimiento: string | null;
  
    ruc: string | null;
  
    especialidad_id: number;
  
    telefono: string | null;
    telefono_02: string | null;
    email: string | null;
  
    adicionales: number;
    extras: number;
    tiempo_promedio_por_paciente: number;
  
    estado?: RecordStatus;
  };
  
  export type MedicoUpdatePayload = {
    cmp: string | null;
    rne: string | null;
    dni: string | null;
  
    tipo_profesional_clinica: TipoProfesionalClinica;
  
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
  
    direccion: string | null;
    centro_trabajo: string | null;
    fecha_nacimiento: string | null;
  
    ruc: string | null;
  
    especialidad_id: number;
  
    telefono: string | null;
    telefono_02: string | null;
    email: string | null;
  
    adicionales: number;
    extras: number;
    tiempo_promedio_por_paciente: number;
  
    estado: RecordStatus;
  };
  
  type EspecialidadApi = {
    id: number;
    codigo?: unknown;
    descripcion?: unknown;
  };
  
  type MedicoApi = {
    id: number;
  
    codigo?: unknown;
  
    cmp?: unknown;
    rne?: unknown;
    dni?: unknown;
  
    tipo_profesional_clinica?: unknown;
  
    nombres?: unknown;
    apellido_paterno?: unknown;
    apellido_materno?: unknown;
  
    direccion?: unknown;
    centro_trabajo?: unknown;
    fecha_nacimiento?: unknown;
  
    ruc?: unknown;
  
    especialidad_id?: unknown;
    especialidad?: unknown;
  
    telefono?: unknown;
    telefono_02?: unknown;
    email?: unknown;
  
    adicionales?: unknown;
    extras?: unknown;
    tiempo_promedio_por_paciente?: unknown;
  
    estado?: unknown;
  
    nombre_completo?: unknown;
  
    created_at?: unknown;
    updated_at?: unknown;
  };
  
  export async function getNextMedicoCodigo(): Promise<{ codigo: string }> {
    const res = await api.get<{ data: { codigo: unknown } }>(
      "/admision/ficheros/medicos/next-codigo"
    );
  
    return { codigo: toStrOrEmpty(res.data?.codigo) };
  }  

  function buildQuery(query: MedicosQuery): string {
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
    const s = toStrOrNull(v);
    return s ?? "";
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
  
  function normalizeEspecialidad(x: unknown): Medico["especialidad"] {
    if (!x || typeof x !== "object") return null;
    const o = x as Record<string, unknown>;
    const id = toIntNonNeg(o.id, 0);
    if (!id) return null;
  
    return {
      id,
      codigo: toStrOrEmpty(o.codigo),
      descripcion: toStrOrEmpty(o.descripcion),
    };
  }
  
  function normalizeTipo(v: unknown): TipoProfesionalClinica {
    const s = toStrOrEmpty(v).toUpperCase();
    if (s === "EXTERNO") return "EXTERNO";
    return "STAFF";
  }
  
  function normalizeEstado(v: unknown): RecordStatus {
    const s = toStrOrEmpty(v).toUpperCase();
    if (s === "INACTIVO") return "INACTIVO";
    if (s === "SUSPENDIDO") return "SUSPENDIDO";
    return "ACTIVO";
  }
  
  function normalizeMedico(x: MedicoApi): Medico {
    const especialidad = normalizeEspecialidad(x.especialidad);
  
    return {
      id: x.id,
  
      codigo: toStrOrEmpty(x.codigo),
  
      cmp: toStrOrNull(x.cmp),
      rne: toStrOrNull(x.rne),
      dni: toStrOrNull(x.dni),
  
      tipo_profesional_clinica: normalizeTipo(x.tipo_profesional_clinica),
  
      nombres: toStrOrEmpty(x.nombres),
      apellido_paterno: toStrOrEmpty(x.apellido_paterno),
      apellido_materno: toStrOrEmpty(x.apellido_materno),
  
      direccion: toStrOrNull(x.direccion),
      centro_trabajo: toStrOrNull(x.centro_trabajo),
      fecha_nacimiento: toStrOrNull(x.fecha_nacimiento),
  
      ruc: toStrOrNull(x.ruc),
  
      especialidad_id: toIntNonNeg(x.especialidad_id, especialidad?.id ?? 0),
      especialidad,
  
      telefono: toStrOrNull(x.telefono),
      telefono_02: toStrOrNull(x.telefono_02),
      email: toStrOrNull(x.email),
  
      adicionales: toIntNonNeg(x.adicionales, 0),
      extras: toIntNonNeg(x.extras, 0),
      tiempo_promedio_por_paciente: toIntNonNeg(x.tiempo_promedio_por_paciente, 0),
  
      estado: normalizeEstado(x.estado),
  
      nombre_completo: toStrOrNull(x.nombre_completo) ?? undefined,
  
      created_at: toStrOrNull(x.created_at) ?? undefined,
      updated_at: toStrOrNull(x.updated_at) ?? undefined,
    };
  }
  
  export async function listMedicos(query: MedicosQuery): Promise<PaginatedResponse<Medico>> {
    const res = await api.get<PaginatedResponse<MedicoApi>>(`/admision/ficheros/medicos${buildQuery(query)}`);
    return {
      ...res,
      data: res.data.map(normalizeMedico),
    };
  }
  
  export async function createMedico(payload: MedicoCreatePayload): Promise<{ data: Medico }> {
    const res = await api.post<{ data: MedicoApi }>(`/admision/ficheros/medicos`, payload);
    return { data: normalizeMedico(res.data) };
  }
  
  export async function updateMedico(id: number, payload: MedicoUpdatePayload): Promise<{ data: Medico }> {
    const res = await api.put<{ data: MedicoApi }>(`/admision/ficheros/medicos/${id}`, payload);
    return { data: normalizeMedico(res.data) };
  }  
  
  export async function deactivateMedico(id: number): Promise<{ data: Medico }> {
    const res = await api.patch<{ data: MedicoApi }>(`/admision/ficheros/medicos/${id}/desactivar`);
    return { data: normalizeMedico(res.data) };
  }
  
  export async function listEspecialidadesLookup(): Promise<EspecialidadLookup[]> {
    const res = await api.get<{
      data: EspecialidadApi[];
      meta: { current_page: number; per_page: number; total: number; last_page: number };
    }>(`/admision/ficheros/especialidades?page=1&per_page=100&status=ACTIVO`);
  
    return (res.data ?? [])
      .map((x) => ({
        id: x.id,
        codigo: toStrOrEmpty(x.codigo),
        descripcion: toStrOrEmpty(x.descripcion),
      }))
      .filter((x) => x.id > 0 && x.codigo.trim() !== "" && x.descripcion.trim() !== "");
  }
  