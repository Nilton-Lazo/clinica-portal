import { api } from "../../../../../shared/api";
import type { PresupuestoListaQuery, PresupuestoListaResponse } from "../types/presupuestoLista.types";

function buildQuery(query: PresupuestoListaQuery): string {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("per_page", String(query.per_page ?? 50));

  const q = (query.q ?? "").trim();
  if (q) params.set("q", q);

  if (query.vigencia_desde) params.set("vigencia_desde", query.vigencia_desde);
  if (query.vigencia_hasta) params.set("vigencia_hasta", query.vigencia_hasta);
  if (query.estado) params.set("estado", query.estado);

  const s = params.toString();
  return s ? `?${s}` : "";
}

export function listPresupuestos(query: PresupuestoListaQuery): Promise<PresupuestoListaResponse> {
  return api.get<PresupuestoListaResponse>(`/admision/citas/presupuestos${buildQuery(query)}`);
}
