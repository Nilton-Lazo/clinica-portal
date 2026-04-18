import { api } from "../../../shared/api";

export type EmisionComprobantesRegistrarPayload = {
  nro_cuenta: string;
  servicio_linea_ids: number[];
  numero_operacion: string | null;
  snapshot: Record<string, unknown>;
};

export type EmisionComprobantesRegistrarResponse = {
  id: number;
  nro_cuenta: string;
  created_at: string | null;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

export async function postEmisionComprobantesRegistrar(
  payload: EmisionComprobantesRegistrarPayload
): Promise<EmisionComprobantesRegistrarResponse> {
  const res = await api.post<unknown>("/caja/emision-comprobantes/registrar", payload);
  if (isObject(res) && "data" in res) {
    const d = (res as { data: EmisionComprobantesRegistrarResponse }).data;
    if (d && typeof d.id === "number") {
      return d;
    }
  }
  throw new Error("Respuesta inválida del servidor.");
}
