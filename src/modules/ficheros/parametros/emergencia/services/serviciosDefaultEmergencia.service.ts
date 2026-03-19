import { api } from "../../../../../shared/api";

const BASE = "/ficheros/parametros/emergencia/servicios-defaults";

function normalizeRaw(raw: unknown): string[] {
  const data = raw as { data?: unknown; servicios?: unknown };
  const maybe = data?.data ?? data?.servicios ?? data;

  if (Array.isArray(maybe)) {
    return maybe.map((x) => String(x).trim()).filter((s) => s.length > 0);
  }

  if (maybe && typeof maybe === "object") {
    const arr = (maybe as Record<string, unknown>).servicios ?? (maybe as { data?: unknown }).data;
    if (Array.isArray(arr)) return arr.map((x) => String(x).trim()).filter((s) => s.length > 0);
  }

  return [];
}

export async function listServiciosDefaultEmergenciaByTarifa(tarifaId: number): Promise<string[]> {
  const res = await api.get<unknown>(`${BASE}/tarifa/${tarifaId}`);
  return normalizeRaw(res);
}

export async function upsertServiciosDefaultEmergenciaByTarifa(
  tarifaId: number,
  servicios: string[]
): Promise<unknown> {
  const payload = {
    tarifa_id: tarifaId,
    servicios: servicios.map((s) => s.trim()).filter(Boolean),
  };

  return api.put<unknown>(`${BASE}/tarifa/${tarifaId}`, payload);
}

