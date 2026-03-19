import type {
  RegistroEmergencia,
  PaginatedResponse,
  RegistroEmergenciaQuery,
} from "../types/registroEmergencia.types";
import { api } from "../../../shared/api";

const CACHE_TTL_MS = 60_000;
const CACHE_MAX_ENTRIES = 50;

type CacheEntry = { data: PaginatedResponse<RegistroEmergencia>; expires: number };

const cache = new Map<string, CacheEntry>();
const byIdCache = new Map<number, { data: RegistroEmergencia; expires: number }>();

function cacheKey(query: RegistroEmergenciaQuery): string {
  const p = new URLSearchParams();
  p.set("page", String(query.page ?? 1));
  p.set("per_page", String(query.per_page ?? 50));
  if (query.q?.trim()) p.set("q", query.q.trim());
  if (query.fecha_desde) p.set("fecha_desde", query.fecha_desde);
  if (query.fecha_hasta) p.set("fecha_hasta", query.fecha_hasta);
  return p.toString();
}

function pruneCache() {
  if (cache.size <= CACHE_MAX_ENTRIES) return;
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expires <= now) cache.delete(key);
  }
  if (cache.size > CACHE_MAX_ENTRIES) {
    const keys = [...cache.keys()].slice(0, cache.size - CACHE_MAX_ENTRIES);
    keys.forEach((k) => cache.delete(k));
  }
}

function buildQuery(query: RegistroEmergenciaQuery): string {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("per_page", String(query.per_page ?? 50));
  const q = (query.q ?? "").trim();
  if (q) params.set("q", q);
  if (query.fecha_desde) params.set("fecha_desde", query.fecha_desde);
  if (query.fecha_hasta) params.set("fecha_hasta", query.fecha_hasta);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function listRegistroEmergencia(
  query: RegistroEmergenciaQuery
): Promise<PaginatedResponse<RegistroEmergencia>> {
  const key = cacheKey(query);
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return Promise.resolve(hit.data);

  return api
    .get<PaginatedResponse<RegistroEmergencia>>(
      `/emergencia/registro${buildQuery(query)}`
    )
    .then((data) => {
      cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
      pruneCache();
      return data;
    });
}

export function invalidateRegistroEmergenciaCache(): void {
  cache.clear();
  byIdCache.clear();
}

export type RegistroEmergenciaStorePayload = {
  orden?: string | null;
  hora?: string | null;
  numero_hc: string;
  apellidos_nombres: string;
  sexo?: string | null;
  tipo_cliente?: string | null;
  fecha: string;
  cuenta?: string | null;
  medico_emergencia?: string | null;
  medico_especialista?: string | null;
  topico?: string | null;
  numero_cuenta?: string | null;
  estado?: string | null;
  tipo_emergencia_id?: number | null;
  topico_id?: number | null;
  medico_emergencia_id?: number | null;
  diagnostico_ingreso?: string | null;
  soat_activo?: boolean;
  soat_tipo_documento_id?: number | null;
  soat_numero_documento?: string | null;
  soat_titular_referencia?: string | null;
  soat_poliza?: string | null;
  soat_placa?: string | null;
  soat_siniestro?: string | null;
  soat_tipo_accidente?: string | null;
  soat_lugar_accidente?: string | null;
  soat_dni_conductor?: string | null;
  soat_apellido_paterno_conductor?: string | null;
  soat_apellido_materno_conductor?: string | null;
  soat_contacto_conductor?: string | null;
  soat_fecha_siniestro?: string | null;
  soat_hora_siniestro?: string | null;
  soat_datos_intervencion_autoridad?: string | null;
  soat_documento_atencion_id_1?: number | null;
  soat_numero_documento_atencion_1?: string | null;
  soat_documento_atencion_id_2?: number | null;
  soat_numero_documento_atencion_2?: string | null;
};

export function getNextOrden(fecha?: string): Promise<{ orden: string }> {
  const params = fecha ? `?fecha=${encodeURIComponent(fecha)}` : "";
  return api.get<{ orden: string }>(`/emergencia/registro/next-orden${params}`);
}

export function createRegistroEmergencia(
  payload: RegistroEmergenciaStorePayload
): Promise<RegistroEmergencia> {
  return api
    .post<{ data: RegistroEmergencia }>("/emergencia/registro", payload)
    .then((res) => res.data);
}

export function updateRegistroEmergencia(
  id: number,
  payload: RegistroEmergenciaStorePayload
): Promise<RegistroEmergencia> {
  return api
    .put<{ data: RegistroEmergencia }>(`/emergencia/registro/${id}`, payload)
    .then((res) => {
      byIdCache.set(id, { data: res.data, expires: Date.now() + CACHE_TTL_MS });
      return res.data;
    });
}

export async function getRegistroEmergencia(id: number): Promise<RegistroEmergencia> {
  const hit = byIdCache.get(id);
  if (hit && hit.expires > Date.now()) return hit.data;
  const res = await api.get<{ data?: RegistroEmergencia } | RegistroEmergencia>(`/emergencia/registro/${id}`);
  const anyRes = res as unknown as { data?: RegistroEmergencia };
  const data = anyRes && anyRes.data ? anyRes.data : ((res as unknown) as RegistroEmergencia);
  byIdCache.set(id, { data, expires: Date.now() + CACHE_TTL_MS });
  return data;
}

export function primeRegistroEmergenciaCache(registro: RegistroEmergencia): void {
  if (!registro?.id) return;
  byIdCache.set(registro.id, { data: registro, expires: Date.now() + CACHE_TTL_MS });
}
