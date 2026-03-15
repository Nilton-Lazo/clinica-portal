import { api } from "../../../../shared/api";
import type {
  PacienteDetail,
  PacienteFormCatalogs,
  PacienteListItem,
  PacienteUpsertPayload,
  PaginatedResponse,
  PacientesQuery,
  SelectOption,
  RecordStatus,
  PacienteContactoEmergenciaPayload,
} from "../types/historiaClinica.types";

function buildQuery(query: PacientesQuery): string {
  const params = new URLSearchParams();

  params.set("page", String(query.page ?? 1));
  params.set("per_page", String(query.per_page ?? 50));

  const q = (query.q ?? "").trim();
  if (q) params.set("q", q);

  if (query.status) params.set("status", query.status);

  if (query.filiacion_from) params.set("filiacion_from", query.filiacion_from);
  if (query.filiacion_to) params.set("filiacion_to", query.filiacion_to);

  const s = params.toString();
  return s ? `?${s}` : "";
}

function toStrOrNull(v: unknown): string | null {
  if (typeof v === "string") {
    const x = v.trim();
    return x ? x : null;
  }
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function toUbigeoCode(v: unknown): string | null {
  if (typeof v === "string") {
    const x = v.trim();
    return x ? x : null;
  }
  if (v && typeof v === "object" && "codigo" in v && typeof (v as { codigo: unknown }).codigo === "string") {
    const c = (v as { codigo: string }).codigo.trim();
    return c ? c : null;
  }
  return null;
}

function toStrOrEmpty(v: unknown): string {
  return toStrOrNull(v) ?? "";
}

function unwrapData<T>(res: unknown): T {
  if (res && typeof res === "object" && "data" in (res as Record<string, unknown>)) {
    return (res as { data: T }).data;
  }
  return res as T;
}

function labelizeEnum(v: string): string {
  const s = v.replace(/_/g, " ").toLowerCase();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : v;
}

function asEnumOptions(v: unknown): SelectOption[] {
  if (!Array.isArray(v)) return [];
  const out: SelectOption[] = [];
  for (const it of v) {
    if (typeof it !== "string") continue;
    const value = it.trim();
    if (!value) continue;
    out.push({ value, label: labelizeEnum(value) });
  }
  return out;
}

function parseContactoEmergencia(v: unknown): PacienteContactoEmergenciaPayload | null {
  if (!v || typeof v !== "object") return null;
  const x = v as Record<string, unknown>;

  const out: PacienteContactoEmergenciaPayload = {
    nombres: toStrOrNull(x.nombres),
    apellido_paterno: toStrOrNull(x.apellido_paterno),
    apellido_materno: toStrOrNull(x.apellido_materno),
    parentesco_emergencia: toStrOrNull(x.parentesco_emergencia),
    celular: toStrOrNull(x.celular),
    telefono: toStrOrNull(x.telefono),
    observaciones: toStrOrNull(x.observaciones),
  };

  const hasAny =
    !!out.nombres ||
    !!out.apellido_paterno ||
    !!out.apellido_materno ||
    !!out.parentesco_emergencia ||
    !!out.celular ||
    !!out.telefono ||
    !!out.observaciones;

  return hasAny ? out : null;
}

export function listPacientes(query: PacientesQuery): Promise<PaginatedResponse<PacienteListItem>> {
  return api.get<PaginatedResponse<PacienteListItem>>(`/admision/pacientes${buildQuery(query)}`);
}

export async function getPaciente(id: number): Promise<PacienteDetail> {
  const res = await api.get<{ data: unknown }>(`/admision/pacientes/${id}`);
  const data = unwrapData<unknown>(res);

  if (!data || typeof data !== "object") throw new Error("Respuesta inválida al cargar paciente.");

  const x = data as Record<string, unknown>;

  return {
    id: Number(x.id ?? id),

    hc: toStrOrEmpty(x.hc),
    nr: toStrOrNull(x.nr),

    tipo_documento: toStrOrEmpty(x.tipo_documento),
    numero_documento: toStrOrNull(x.numero_documento),

    nombres: toStrOrNull(x.nombres),
    apellido_paterno: toStrOrNull(x.apellido_paterno),
    apellido_materno: toStrOrNull(x.apellido_materno),

    estado_civil: toStrOrNull(x.estado_civil),
    sexo: toStrOrNull(x.sexo),
    fecha_nacimiento: toStrOrNull(x.fecha_nacimiento),

    nacionalidad_iso2: toStrOrNull(x.nacionalidad_iso2),
    ubigeo_nacimiento: toUbigeoCode(x.ubigeo_nacimiento),
    direccion: toStrOrNull(x.direccion),
    ubigeo_domicilio: toUbigeoCode(x.ubigeo_domicilio),

    parentesco_seguro: toStrOrNull(x.parentesco_seguro),
    titular_nombre: toStrOrNull(x.titular_nombre),

    celular: toStrOrNull(x.celular),
    telefono: toStrOrNull(x.telefono),
    email: toStrOrNull(x.email),

    medico_tratante_id: typeof x.medico_tratante_id === "number" ? x.medico_tratante_id : null,

    tipo_sangre: toStrOrNull(x.tipo_sangre),
    tipo_paciente: toStrOrNull(x.tipo_paciente),

    ocupacion: toStrOrNull(x.ocupacion),

    medio_informacion: toStrOrNull(x.medio_informacion),
    medio_informacion_detalle: toStrOrNull(x.medio_informacion_detalle),

    ubicacion_archivo_hc: toStrOrNull(x.ubicacion_archivo_hc),

    estado: (toStrOrEmpty(x.estado) as RecordStatus) || "ACTIVO",

    contacto_emergencia: parseContactoEmergencia(x.contacto_emergencia),

    created_at: toStrOrEmpty(x.created_at),
    updated_at: toStrOrEmpty(x.updated_at),

    nombre_completo: toStrOrNull(x.nombre_completo) ?? undefined,
    edad: typeof x.edad === "number" ? x.edad : null,
  };
}

export function createPaciente(payload: PacienteUpsertPayload): Promise<{ data: PacienteDetail }> {
  return api.post<{ data: PacienteDetail }>(`/admision/pacientes`, payload);
}

export function updatePaciente(id: number, payload: PacienteUpsertPayload): Promise<{ data: PacienteDetail }> {
  return api.put<{ data: PacienteDetail }>(`/admision/pacientes/${id}`, payload);
}

export async function getPacienteFormCatalogs(): Promise<PacienteFormCatalogs> {
  const res = await api.get<{ data: unknown }>(`/admision/catalogos/paciente-form`);
  const data = unwrapData<unknown>(res);
  const obj = data && typeof data === "object" ? (data as Record<string, unknown>) : {};

  return {
    tipos_documento: asEnumOptions(obj.tipo_documento),
    estados_civiles: asEnumOptions(obj.estado_civil),
    sexos: asEnumOptions(obj.sexo),
    parentescos_seguro: asEnumOptions(obj.parentesco_seguro),
    parentescos_emergencia: asEnumOptions(obj.parentesco_emergencia),
    tipos_paciente: asEnumOptions(obj.tipo_paciente),
    ocupaciones: asEnumOptions(obj.ocupacion),
    medios_informacion: asEnumOptions(obj.medio_informacion),
    tipos_sangre: asEnumOptions(obj.tipo_sangre),
  };
}

export type { RecordStatus };
