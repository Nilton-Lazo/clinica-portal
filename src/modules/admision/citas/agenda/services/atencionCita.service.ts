import { api } from "../../../../../shared/api";
import type {
  AtencionCitaData,
  AtencionCitaStorePayload,
} from "../types/atencionCita.types";

export async function getAtencionCitaData(citaId: number): Promise<AtencionCitaData> {
  return api.get<AtencionCitaData>(`/admision/citas/agenda-medica/${citaId}/atencion`);
}

export async function guardarAtencionCita(
  citaId: number,
  payload: AtencionCitaStorePayload
): Promise<AtencionCitaData> {
  return api.post<AtencionCitaData>(`/admision/citas/agenda-medica/${citaId}/atencion`, payload);
}

export type TarifaServicioBusqueda = {
  id: number;
  codigo: string;
  nomenclador: string | null;
  descripcion: string;
  precio_sin_igv: string;
  unidad: string;
  estado: string;
  categoria_id: number;
  categoria_codigo: string;
  categoria_nombre: string;
  subcategoria_id: number;
  subcategoria_codigo: string;
  subcategoria_nombre: string;
  desea_liberar_precio?: boolean;
  recargo_noche_activo?: boolean;
  recargo_noche_porcentaje?: number;
};

export type TarifaServiciosBusquedaMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  /** Si true, la tarifa usa precio directo (ej. Particular/Privado). */
  tarifa_es_precio_directo?: boolean;
};

export async function getIgvPorcentaje(): Promise<number> {
  const res = await api.get<{ igv_porcentaje: number }>("/admision/ficheros/parametros/igv");
  return res.igv_porcentaje ?? 18;
}

export async function buscarServiciosTarifa(
  tarifaId: number,
  params: {
    page?: number;
    per_page?: number;
    q?: string;
    codigo?: string;
    nomenclador?: string;
    categoria_id?: number;
    subcategoria_id?: number;
    status?: string;
    /** Hora de la cita (HH:mm o HH:mm:ss) para aplicar reglas de recargo nocturno */
    hora?: string;
  }
): Promise<{ data: TarifaServicioBusqueda[]; meta: TarifaServiciosBusquedaMeta }> {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const qs = sp.toString() ? `?${sp.toString()}` : "";
  return api.get<{ data: TarifaServicioBusqueda[]; meta: TarifaServiciosBusquedaMeta }>(
    `/admision/ficheros/tarifas/${tarifaId}/servicios${qs}`
  );
}
