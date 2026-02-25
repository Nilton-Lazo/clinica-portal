import { api } from "../../../../../shared/api";
import type {
  AgendaCita,
  AgendaCitaPayload,
  AgendaCitasPaginated,
  AgendaCitasQuery,
  AgendaOpciones,
  AgendaSlotsResponse,
  PacienteAgenda,
} from "../types/agendaMedica.types";

type ApiDataShape = { data?: unknown; meta?: unknown; programacion?: unknown };

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

function unwrapData<T>(res: unknown): T {
  if (isObject(res) && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

function qs(params: Record<string, string | number | null | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export async function getAgendaOpciones(payload: {
  fecha: string;
  especialidad_id?: number | null;
  medico_id?: number | null;
}): Promise<AgendaOpciones> {
  const res = await api.get<unknown>(
    `/admision/citas/agenda-medica/opciones${qs(payload)}`
  );
  return unwrapData<AgendaOpciones>(res);
}

export async function getAgendaSlots(payload: {
  fecha: string;
  especialidad_id: number;
  medico_id: number;
}): Promise<AgendaSlotsResponse> {
  const res = await api.get<unknown>(
    `/admision/citas/agenda-medica/slots${qs(payload)}`
  );
  return unwrapData<AgendaSlotsResponse>(res);
}

export async function listAgendaCitas(
  query: AgendaCitasQuery
): Promise<{ data: AgendaCitasPaginated; programacion: AgendaSlotsResponse["programacion"] | null }> {
  const res = await api.get<unknown>(
    `/admision/citas/agenda-medica${qs(query)}`
  );
  const o: ApiDataShape = isObject(res) ? (res as ApiDataShape) : {};
  const rows = Array.isArray(o.data) ? o.data : [];
  const metaObj = isObject(o.meta) ? (o.meta as Record<string, unknown>) : {};
  const data: AgendaCitasPaginated = {
    data: rows as AgendaCita[],
    meta: {
      current_page: Number(metaObj.current_page ?? 1),
      per_page: Number(metaObj.per_page ?? 50),
      total: Number(metaObj.total ?? rows.length),
      last_page: Number(metaObj.last_page ?? 1),
    },
  };
  const programacion = isObject(o.programacion) ? (o.programacion as AgendaSlotsResponse["programacion"]) : null;
  return { data, programacion };
}

export async function createAgendaCita(payload: AgendaCitaPayload) {
  const res = await api.post<unknown>(`/admision/citas/agenda-medica`, payload);
  return unwrapData<unknown>(res);
}

export async function anularAgendaCita(id: number): Promise<void> {
  await api.patch(`/admision/citas/agenda-medica/${id}/anular`);
}

type IafaRaw = { id?: number; codigo?: string; descripcion_corta?: string; razon_social?: string };

type PacienteApiResponse = {
  id?: number;
  hc?: string;
  nr?: string | null;
  nombre_completo?: string;
  sexo?: string | null;
  edad?: number | null;
  titular_nombre?: string | null;
  planes?: Array<{ tipo_cliente?: { iafa?: IafaRaw }; tipoCliente?: { iafa?: IafaRaw } }>;
};

export async function getPacienteAgenda(id: number): Promise<PacienteAgenda> {
  const res = await api.get<unknown>(`/admision/pacientes/${id}`);
  const x = unwrapData<PacienteApiResponse>(res) ?? {};

  const planes = Array.isArray(x.planes) ? x.planes : [];
  const iafas = planes
    .map((p: { tipo_cliente?: { iafa?: IafaRaw }; tipoCliente?: { iafa?: IafaRaw } }) => p?.tipo_cliente?.iafa ?? p?.tipoCliente?.iafa)
    .filter((i: IafaRaw | undefined): i is IafaRaw => !!i && typeof i.id === "number")
    .map((i: IafaRaw) => {
      const codigo = i.codigo ? String(i.codigo) : "";
      const nombre = String(i.descripcion_corta ?? i.razon_social ?? i.codigo ?? `IAFA ${i.id}`);
      const label = codigo && !nombre.startsWith(codigo) ? `${codigo} · ${nombre}` : nombre;
      return { id: Number(i.id), descripcion: label };
    });

  const uniqueIafas = Array.from(
    new Map(iafas.map((i: { id: number; descripcion: string }) => [i.id, i])).values()
  ) as Array<{ id: number; descripcion: string }>;

  return {
    id: Number(x.id ?? id),
    hc: String(x.hc ?? ""),
    nr: x.nr ? String(x.nr) : null,
    nombre_completo: String(x.nombre_completo ?? ""),
    sexo: x.sexo ? String(x.sexo) : null,
    edad: typeof x.edad === "number" ? x.edad : null,
    titular_nombre: x.titular_nombre ? String(x.titular_nombre) : null,
    iafas: uniqueIafas,
  };
}

export type AgendaInitData = {
  opciones: {
    especialidades: AgendaEspecialidadOption[];
    medicos: AgendaMedicoOption[];
  };
  citas: {
    paginator: AgendaCitasPaginated | null;
    programacion: AgendaProgramacion | null;
  } | null;
  slots: AgendaSlotsResponse | null;
  programacion: AgendaProgramacion | null;
  defaults: {
    especialidad_id: number | null;
    medico_id: number | null;
  };
};

export async function getAgendaInitData(fecha: string): Promise<{ data: AgendaInitData }> {
  return api.get(`/admision/citas/agenda-medica/init?fecha=${fecha}`);
}

