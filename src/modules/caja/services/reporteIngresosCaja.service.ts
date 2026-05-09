import { api } from "../../../shared/api";
import type { PaginationMeta } from "../../../shared/types/pagination";

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
  ajuste_cierre: string | null;
  estado: string;
  tipo: string;
};

export type ReporteIngresosBootstrap = {
  series: ReporteIngresosSerie[];
  medios_contado: ReporteIngresosMedio[];
  medios_adicionales: ReporteIngresosMedio[];
  aperturas: ReporteIngresosApertura[];
  aperturas_meta: PaginationMeta;
  apertura_preferida_id: string | null;
};

export type ReporteFraccionarLineaPago = {
  forma_pago_id: number;
  medio_pago_id: number;
  banco_tarjeta_id: number | null;
  numero_operacion: string | null;
  fecha_vencimiento?: string | null;
  monto: string;
};

export type ReporteFraccionarContext = {
  emision_total: string;
  lineas_pago: ReporteFraccionarLineaPago[];
};

export type ReporteIngresosMovimiento = {
  id: string;
  emision_comprobante_id: string;
  linea_pago_id: string | null;
  pagos_en_emision: number;
  fraccionar_permitido: boolean;
  fraccionar_context: ReporteFraccionarContext;
  cuenta: string;
  paciente: string;
  medico: string;
  tipo_comprobante: string;
  num_comprobante: string;
  total: string;
  estado: string;
  pago_fracc: string;
  medio_pago: string;
  origen_sigla: string;
  adelanto: string;
  usuario_elimina: string;
};

export type ReporteIngresosMovimientosPayload = {
  movimientos: ReporteIngresosMovimiento[];
  meta: PaginationMeta;
  totales_por_medio: Record<string, string>;
  totales_documento: { facturas: string; boletas: string; recibo_caja: string };
  total_general: string;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

export async function fetchReporteIngresosBootstrap(params?: { aperturasPage?: number }): Promise<ReporteIngresosBootstrap> {
  const q = new URLSearchParams();
  if (params?.aperturasPage != null && params.aperturasPage > 0) {
    q.set("aperturas_page", String(params.aperturasPage));
  }
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return api.get<ReporteIngresosBootstrap>(`/caja/reporte-ingresos/bootstrap${suffix}`);
}

export async function fetchReporteIngresosMovimientos(params: {
  cajaAperturaId: number;
  numeracionId?: string;
  page?: number;
  perPage?: number;
}): Promise<ReporteIngresosMovimientosPayload> {
  const q = new URLSearchParams();
  q.set("caja_apertura_id", String(params.cajaAperturaId));
  if (params.numeracionId) q.set("numeracion_id", params.numeracionId);
  if (params.page != null && params.page > 0) q.set("page", String(params.page));
  if (params.perPage != null && params.perPage > 0) q.set("per_page", String(params.perPage));
  const res = await api.get<unknown>(`/caja/reporte-ingresos/movimientos?${q.toString()}`);
  if (isObject(res) && "data" in res) {
    return (res as { data: ReporteIngresosMovimientosPayload }).data;
  }
  throw new Error("El servidor no devolvió los movimientos del reporte de ingresos.");
}
