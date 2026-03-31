import { api } from "../../../../../shared/api";

export type PresupuestoStorePayload = {
  paciente_id: number;
  paciente_plan_id: number;
  tarifa_id: number | null;
  cliente_id: number | null;
  vigencia_hasta: string;
  estado: string;
  monto_a_pagar: number;
  payload: Record<string, unknown>;
};

export type PresupuestoStoreResponse = {
  id: number;
  codigo: string;
  paciente_id: number;
  paciente_plan_id: number;
  vigencia_hasta: string;
  estado: string;
  monto_a_pagar: string;
  created_at: string | null;
};

export async function storePresupuesto(body: PresupuestoStorePayload): Promise<PresupuestoStoreResponse> {
  const res = await api.post<{ data: PresupuestoStoreResponse }>("/admision/citas/presupuestos", body);
  return res.data;
}
