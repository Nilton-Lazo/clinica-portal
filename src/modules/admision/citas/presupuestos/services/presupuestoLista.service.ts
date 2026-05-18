import { api } from "../../../../../shared/api";
import { buildListQuery } from "../../../../../shared/datagrid";
import type { PresupuestoListaQuery, PresupuestoListaResponse } from "../types/presupuestoLista.types";

function buildQuery(query: PresupuestoListaQuery): string {
  return buildListQuery({
    page: query.page ?? 1,
    per_page: query.per_page ?? 50,
    q: query.q,
    sort: query.sort,
    sort_dir: query.sort_dir,
    vigencia_desde: query.vigencia_desde,
    vigencia_hasta: query.vigencia_hasta,
    estado: query.estado,
  });
}

export function listPresupuestos(query: PresupuestoListaQuery): Promise<PresupuestoListaResponse> {
  return api.get<PresupuestoListaResponse>(`/admision/citas/presupuestos${buildQuery(query)}`);
}
