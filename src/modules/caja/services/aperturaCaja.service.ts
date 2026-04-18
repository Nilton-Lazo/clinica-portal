import { api } from "../../../shared/api";
import type { CajaAperturaTipo } from "../types/aperturaCaja.types";

export type CajaAperturaResumen = {
  ultimo_cierre_monto: string | null;
  ultimo_cierre_moneda: string;
  fondo_emergencia_monto: string | null;
  fondo_emergencia_moneda: string;
  operadores_activos_text: string;
  cajas_activas: {
    tipos: CajaAperturaTipo[];
    normal: boolean;
    chica: boolean;
  };
  ultima_apertura: {
    codigo: string;
    monto_inicio: string;
    moneda: string;
    apertura_at: string;
  } | null;
};

export async function getNextCodigoApertura(): Promise<string> {
  const res = await api.get<{ data: { codigo: string } }>("/caja/aperturas/next-codigo");
  return String(res.data?.codigo ?? "").trim();
}

export async function getResumenApertura(): Promise<CajaAperturaResumen> {
  const res = await api.get<{ data: CajaAperturaResumen }>("/caja/aperturas/resumen");
  return res.data;
}

export type CajaAperturaCreatePayload = {
  tipo: CajaAperturaTipo;
  user_entrega_id: number;
  area_jefatura_id: number;
  monto_inicio: number;
  observaciones: string | null;
};

export type CajaAperturaClosePayload = {
  tipo: CajaAperturaTipo;
  observaciones_cierre?: string | null;
};

export async function createAperturaCaja(payload: CajaAperturaCreatePayload): Promise<unknown> {
  return api.post("/caja/aperturas", payload);
}

export async function closeAperturaCaja(payload: CajaAperturaClosePayload): Promise<unknown> {
  return api.post("/caja/aperturas/cerrar", payload);
}
