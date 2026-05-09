import { api } from "../../../shared/api";

export type EmisionComprobantesRegistrarPayload = {
  emision_origen: string;
  nro_cuenta: string;
  numeracion_id: number;
  forma_pago_id: number;
  medio_pago_id: number;
  banco_tarjeta_id: number | null;
  servicio_linea_ids: number[];
  numero_operacion: string | null;
  fecha_vencimiento: string | null;
  snapshot: Record<string, unknown>;
  adelanto?: {
    enabled: boolean;
    servicio_codigo?: string;
    monto_con_igv?: number;
  };
};

export type EmisionComprobantesRegistrarResponse = {
  id: number;
  nro_cuenta: string;
  numeracion_comprobante_id: number | null;
  tipo_documento_id: number | null;
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
      return {
        ...d,
        numeracion_comprobante_id:
          typeof d.numeracion_comprobante_id === "number" ? d.numeracion_comprobante_id : null,
        tipo_documento_id: typeof d.tipo_documento_id === "number" ? d.tipo_documento_id : null,
      };
    }
  }
  throw new Error("El servidor no devolvió los datos de la emisión del comprobante.");
}
