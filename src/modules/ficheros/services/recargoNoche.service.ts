import { api } from "../../../shared/api";

export type RecordStatusRecargo = "ACTIVO" | "INACTIVO" | "SUSPENDIDO";

export type RecargoNocheRegla = {
  id: number;
  tarifa_id: number;
  tarifa_categoria_id: number;
  categoria_codigo: string | null;
  categoria_nombre: string | null;
  porcentaje: number;
  hora_desde: string;
  hora_hasta: string | null;
  estado: RecordStatusRecargo;
  created_at?: string;
  updated_at?: string;
};

export type TarifaOperativa = { id: number; codigo: string; descripcion_tarifa?: string };

export type CategoriaLookupItem = { id: number; codigo: string; nombre: string };

export async function getTarifasOperativas(): Promise<TarifaOperativa[]> {
  const res = await api.get<{ data: TarifaOperativa[] }>("/ficheros/tarifas/operativas");
  return Array.isArray(res.data) ? res.data : [];
}

export async function getCategoriasLookup(tarifaId: number): Promise<CategoriaLookupItem[]> {
  const res = await api.get<{ data?: Array<{ id: number; codigo?: string; descripcion?: string }> }>(
    `/ficheros/tarifas/${tarifaId}/categorias/lookup?only_active=1`
  );
  const data = res.data;
  if (!Array.isArray(data)) return [];
  return data.map((c) => ({
    id: c.id,
    codigo: c.codigo ?? "",
    nombre: (c.descripcion ?? "").trim() || String(c.id),
  }));
}

export async function listRecargoNoche(
  tarifaId: number,
  params?: { status?: string }
): Promise<RecargoNocheRegla[]> {
  const qs = params?.status ? `?status=${encodeURIComponent(params.status)}` : "";
  const res = await api.get<{ data: RecargoNocheRegla[] }>(
    `/ficheros/tarifas/${tarifaId}/recargo-noche${qs}`
  );
  return Array.isArray(res.data) ? res.data : [];
}

function horaDesdeMas12(hora: string): string {
  const [h, m] = hora.split(":").map((x) => parseInt(x, 10) || 0);
  const next = (h + 12) % 24;
  return `${String(next).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export async function createRecargoNoche(
  tarifaId: number,
  payload: {
    tarifa_categoria_id: number;
    porcentaje: number;
    hora_desde?: string;
    hora_hasta?: string;
    estado?: string;
  }
): Promise<RecargoNocheRegla> {
  const horaDesde =
    payload.hora_desde && payload.hora_desde.trim() ? payload.hora_desde.trim() : "19:00";
  const body: Record<string, unknown> = {
    tarifa_categoria_id: payload.tarifa_categoria_id,
    porcentaje: payload.porcentaje,
    hora_desde: horaDesde,
    hora_hasta:
      payload.hora_hasta && payload.hora_hasta.trim()
        ? payload.hora_hasta.trim()
        : horaDesdeMas12(horaDesde),
  };
  if (payload.estado) body.estado = payload.estado;
  const res = await api.post<{ data: RecargoNocheRegla }>(
    `/ficheros/tarifas/${tarifaId}/recargo-noche`,
    body
  );
  return (res as { data: RecargoNocheRegla }).data;
}

export async function updateRecargoNoche(
  tarifaId: number,
  id: number,
  payload: { porcentaje?: number; hora_desde?: string; hora_hasta?: string; estado?: string }
): Promise<RecargoNocheRegla> {
  const res = await api.put<{ data: RecargoNocheRegla }>(
    `/ficheros/tarifas/${tarifaId}/recargo-noche/${id}`,
    payload
  );
  return (res as { data: RecargoNocheRegla }).data;
}

export async function deactivateRecargoNoche(
  tarifaId: number,
  id: number
): Promise<RecargoNocheRegla> {
  const res = await api.patch<{ data: RecargoNocheRegla }>(
    `/ficheros/tarifas/${tarifaId}/recargo-noche/${id}/desactivar`
  );
  return (res as { data: RecargoNocheRegla }).data;
}
