import { api } from "../../../../shared/api";

export type CuentaDetalleEmisionComprobante = {
  numeracion_comprobante_id: number;
  tipo_documento_id: number | null;
  serie: string;
  numero_emitido: number;
  numero_formateado: string;
};

export type CuentaDetallePayload = {
  cuenta: {
    id: number;
    nro_cuenta: string;
    origen: string;
    origen_id: number;
    paciente_id: number | null;
    paciente_plan_id: number | null;
    tarifa_id: number | null;
    estado?: string;
  };
  detalle: unknown;
  emision_comprobante?: CuentaDetalleEmisionComprobante | null;
  adelanto_resumen?: {
    total_adelanto: string;
  } | null;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

function unwrapData<T>(res: unknown): T {
  if (isObject(res) && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export async function fetchCuentaDetalle(nroCuenta: string): Promise<CuentaDetallePayload> {
  const res = await api.get<unknown>(`/admision/cuentas/${encodeURIComponent(nroCuenta)}`);
  return unwrapData<CuentaDetallePayload>(res);
}

export function autorizacionSitedsFromCuentaDetalle(payload: CuentaDetallePayload): string {
  if (payload.cuenta.origen !== "CITA_ATENCION") return "";
  const det = payload.detalle;
  if (!det || typeof det !== "object") return "";
  const cita = (det as { cita?: { autorizacion_siteds?: unknown } }).cita;
  if (!cita) return "";
  const v = cita.autorizacion_siteds;
  if (typeof v === "string" && v.trim() !== "") return v.trim();
  return "";
}
