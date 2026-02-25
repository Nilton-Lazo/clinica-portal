import { api } from "../../../../shared/api";
import type {
  AddPlanPayload,
  AddPlanResponse,
  DeactivatePlanResponse,
  PaginatedResponse,
  RecordStatus,
  TipoClienteListItem,
} from "./acreditacion.types";

export type TipoClienteFilters = {
  q?: string;
  status?: RecordStatus;
  per_page?: number;
  page?: number;
};

function toQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    const s = String(v).trim();
    if (!s) return;
    sp.set(k, s);
  });

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export const acreditacionService = {
  tiposClientes(filters: TipoClienteFilters = {}): Promise<PaginatedResponse<TipoClienteListItem>> {
    const url = `/ficheros/tipos-clientes${toQuery(filters as Record<string, unknown>)}`;
    return api.get(url);
  },

  addPlan(pacienteId: number, payload: AddPlanPayload): Promise<AddPlanResponse> {
    return api.post(`/admision/pacientes/${pacienteId}/planes`, payload);
  },

  deactivatePlan(planId: number): Promise<DeactivatePlanResponse> {
    return api.patch(`/admision/pacientes/planes/${planId}/desactivar`);
  },
};
