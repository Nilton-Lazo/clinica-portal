import { api } from "../../../shared/api";

export type FraccionarPagoLineaPayload = {
  forma_pago_id: number;
  medio_pago_id: number;
  banco_tarjeta_id?: number | null;
  numero_operacion?: string | null;
  fecha_vencimiento?: string | null;
  monto: number;
};

export type FraccionarEmisionPagosBody = {
  pagos: FraccionarPagoLineaPayload[];
};

export async function postFraccionarEmisionPagos(emisionComprobanteId: number, body: FraccionarEmisionPagosBody): Promise<void> {
  await api.post(`/caja/emision-comprobantes/${emisionComprobanteId}/fraccionar-pagos`, body);
}
