import { api } from "../../../shared/api";

export type ReporteIngresosSerie = {
  id: number;
  serie: string;
  label: string;
};

export type ReporteIngresosMedio = {
  id: number;
  codigo: string;
  descripcion: string;
};

export type ReporteIngresosApertura = {
  id: string;
  codigo: string;
  usuario: string;
  fecha: string;
  monto_apertura: string;
  monto_cierre: string;
  estado: string;
  tipo: string;
};

export type ReporteIngresosBootstrap = {
  series: ReporteIngresosSerie[];
  medios_contado: ReporteIngresosMedio[];
  aperturas: ReporteIngresosApertura[];
  apertura_preferida_id: string | null;
};

export type ReporteIngresosMovimiento = {
  id: string;
  cuenta: string;
  paciente: string;
  medico_servicio: string;
  tipo_comprobante: string;
  num_comprobante: string;
  total: string;
  cuenta_pago: string;
  estado: string;
  pago_fracc: string;
  medio_pago: string;
  tipo: string;
  adelanto: string;
  usuario_elimina: string;
};

export type ReporteIngresosMovimientosPayload = {
  movimientos: ReporteIngresosMovimiento[];
  totales_por_medio: Record<string, string>;
  totales_documento: { facturas: string; boletas: string; recibo_caja: string };
  total_general: string;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

export async function fetchReporteIngresosBootstrap(): Promise<ReporteIngresosBootstrap> {
  return api.get<ReporteIngresosBootstrap>("/caja/reporte-ingresos/bootstrap");
}

export async function fetchReporteIngresosMovimientos(params: {
  cajaAperturaId: number;
  numeracionId?: string;
}): Promise<ReporteIngresosMovimientosPayload> {
  const q = new URLSearchParams();
  q.set("caja_apertura_id", String(params.cajaAperturaId));
  if (params.numeracionId) q.set("numeracion_id", params.numeracionId);
  const res = await api.get<unknown>(`/caja/reporte-ingresos/movimientos?${q.toString()}`);
  if (isObject(res) && "data" in res) {
    return (res as { data: ReporteIngresosMovimientosPayload }).data;
  }
  throw new Error("Respuesta inválida del servidor.");
}
