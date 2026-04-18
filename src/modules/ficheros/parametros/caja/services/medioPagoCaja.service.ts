import { api } from "../../../../../shared/api";
import type { RecordStatus, PaginationMeta } from "../../emergencia/types/paramOption.types";

export type FormaPagoCajaOption = {
  id: number;
  codigo: string;
  descripcion: string;
  estado: RecordStatus;
};

export type MedioPagoCajaItem = {
  id: number;
  codigo: string;
  descripcion: string;
  estado: RecordStatus;
  forma_pago_ids: number[];
  forma_pago_labels: string[];
};

export type MedioPagoCajaListResponse = {
  data: MedioPagoCajaItem[];
  meta: PaginationMeta;
};

export type MedioPagoCajaQuery = {
  page?: number;
  per_page?: number;
  q?: string;
  status?: RecordStatus;
};

export type MedioPagoCajaCreatePayload = {
  codigo: string;
  descripcion: string;
  estado?: RecordStatus;
  forma_pago_ids: number[];
};

export type MedioPagoCajaUpdatePayload = {
  codigo: string;
  descripcion: string;
  estado: RecordStatus;
  forma_pago_ids: number[];
};

const BASE = "/ficheros/parametros/caja/medio-pago";
const FORMAS_BASE = "/ficheros/parametros/caja/forma-pago";

function buildQuery(query: MedioPagoCajaQuery): string {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("per_page", String(query.per_page ?? 50));
  const q = (query.q ?? "").trim();
  if (q) params.set("q", q);
  if (query.status) params.set("status", query.status);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export async function getNextMedioPagoCajaCodigo(): Promise<{ codigo: string }> {
  const res = await api.get<{ data: { codigo: unknown } }>(`${BASE}/next-codigo`);
  return { codigo: String(res.data?.codigo ?? "").trim() };
}

export function listMedioPagoCaja(query: MedioPagoCajaQuery): Promise<MedioPagoCajaListResponse> {
  return api.get<MedioPagoCajaListResponse>(`${BASE}${buildQuery(query)}`);
}

export function createMedioPagoCaja(payload: MedioPagoCajaCreatePayload): Promise<{ data: MedioPagoCajaItem }> {
  return api.post<{ data: MedioPagoCajaItem }>(BASE, payload);
}

export function updateMedioPagoCaja(id: number, payload: MedioPagoCajaUpdatePayload): Promise<{ data: MedioPagoCajaItem }> {
  return api.put<{ data: MedioPagoCajaItem }>(`${BASE}/${id}`, payload);
}

export function deactivateMedioPagoCaja(id: number): Promise<{ data: MedioPagoCajaItem }> {
  return api.patch<{ data: MedioPagoCajaItem }>(`${BASE}/${id}/desactivar`);
}

export async function listFormasPagoActivas(): Promise<FormaPagoCajaOption[]> {
  const res = await api.get<{ data: FormaPagoCajaOption[] }>(`${FORMAS_BASE}?page=1&per_page=100&status=ACTIVO`);
  return Array.isArray(res.data) ? res.data : [];
}
