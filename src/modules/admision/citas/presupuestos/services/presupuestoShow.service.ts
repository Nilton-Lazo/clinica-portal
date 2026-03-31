import { api } from "../../../../../shared/api";
import { getCachedPresupuestoShow, setCachedPresupuestoShow } from "./presupuestoShowCache";

export type PresupuestoShowPayload = Record<string, unknown>;

export type PresupuestoShowData = {
  id: number;
  codigo: string;
  paciente_id: number;
  paciente_plan_id: number;
  tarifa_id: number | null;
  cliente_id: number | null;
  vigencia_hasta: string | null;
  estado: string;
  monto_a_pagar: string;
  payload: PresupuestoShowPayload;
  created_at?: string | null;
};

export async function fetchPresupuestoShow(id: number): Promise<PresupuestoShowData> {
  const res = await api.get<{ data: PresupuestoShowData }>(`/admision/citas/presupuestos/${id}`);
  return res.data;
}

export async function fetchPresupuestoShowCached(id: number): Promise<PresupuestoShowData> {
  const hit = getCachedPresupuestoShow(id);
  if (hit) return hit;
  const data = await fetchPresupuestoShow(id);
  setCachedPresupuestoShow(id, data);
  return data;
}
