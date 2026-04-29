import { api } from "../../../shared/api";

export type EmisionComprobantesRegistrarPayload = {
  nro_cuenta: string;
  numeracion_id: number;
  servicio_linea_ids: number[];
  numero_operacion: string | null;
  fecha_vencimiento: string | null;
  snapshot: Record<string, unknown>;
};

export type EmisionComprobantesRegistrarResponse = {
  id: number;
  nro_cuenta: string;
  serie: string | null;
  numero_emitido: number | null;
  numero_formateado: string | null;
  fecha_vencimiento: string | null;
  total_paciente: string | null;
  total_lineas: number;
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
  throw new Error("El servidor no devolvió los datos de la emisión del comprobante.");
}
