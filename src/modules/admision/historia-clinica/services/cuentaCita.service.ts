import { api } from "../../../../shared/api";
import type { CuentaCitaListItem, CuentasCitaQuery, PaginatedResponse } from "../types/cuentaCita.types";

function buildQuery(query: CuentasCitaQuery): string {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("per_page", String(query.per_page ?? 25));
  const q = (query.q ?? "").trim();
  if (q) params.set("q", q);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function listCuentasCita(query: CuentasCitaQuery): Promise<PaginatedResponse<CuentaCitaListItem>> {
  return api.get<PaginatedResponse<CuentaCitaListItem>>(`/admision/cuentas-cita${buildQuery(query)}`);
}
