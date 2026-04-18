import { api } from "../../../../../shared/api";
import type { RecordStatus, PaginationMeta } from "../../emergencia/types/paramOption.types";

export type MedioDisponibleBancoTarjeta = {
  id: number;
  codigo: string;
  descripcion: string;
  estado: RecordStatus;
};

export type BancoTarjetaCajaItem = {
  id: number;
  codigo: string;
  descripcion: string;
  estado: RecordStatus;
  forma_pago_ids: number[];
  medio_pago_ids: number[];
  forma_pago_labels: string[];
  medio_pago_labels: string[];
  resumen_secundario: string;
};

export type BancoTarjetaCajaListResponse = {
  data: BancoTarjetaCajaItem[];
  meta: PaginationMeta;
};

export type BancoTarjetaCajaQuery = {
  page?: number;
  per_page?: number;
  q?: string;
  status?: RecordStatus;
};

export type BancoTarjetaCajaCreatePayload = {
  codigo?: string;
  descripcion: string;
  estado?: RecordStatus;
  forma_pago_ids: number[];
  medio_pago_ids: number[];
};

export type BancoTarjetaCajaUpdatePayload = {
  codigo: string;
  descripcion: string;
  estado: RecordStatus;
  forma_pago_ids: number[];
  medio_pago_ids: number[];
};

const BASE = "/ficheros/parametros/caja/banco-tarjeta";

function buildQuery(query: BancoTarjetaCajaQuery): string {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("per_page", String(query.per_page ?? 50));
  const q = (query.q ?? "").trim();
  if (q) params.set("q", q);
  if (query.status) params.set("status", query.status);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export async function getNextBancoTarjetaCajaCodigo(): Promise<{ codigo: string }> {
  const res = await api.get<{ data: { codigo: unknown } }>(`${BASE}/next-codigo`);
  return { codigo: String(res.data?.codigo ?? "").trim() };
}

export function listBancoTarjetaCaja(query: BancoTarjetaCajaQuery): Promise<BancoTarjetaCajaListResponse> {
  return api.get<BancoTarjetaCajaListResponse>(`${BASE}${buildQuery(query)}`);
}

export async function listMediosDisponiblesBancoTarjeta(formaPagoIds: number[]): Promise<MedioDisponibleBancoTarjeta[]> {
  const ids = [...new Set(formaPagoIds.filter((n) => Number.isFinite(n) && n > 0))];
  if (ids.length === 0) return [];
  const res = await api.get<{ data: MedioDisponibleBancoTarjeta[] }>(
    `${BASE}/medios-disponibles?forma_pago_ids=${ids.join(",")}`
  );
  return Array.isArray(res.data) ? res.data : [];
}

export function createBancoTarjetaCaja(payload: BancoTarjetaCajaCreatePayload): Promise<{ data: BancoTarjetaCajaItem }> {
  return api.post<{ data: BancoTarjetaCajaItem }>(BASE, payload);
}

export function updateBancoTarjetaCaja(
  id: number,
  payload: BancoTarjetaCajaUpdatePayload
): Promise<{ data: BancoTarjetaCajaItem }> {
  return api.put<{ data: BancoTarjetaCajaItem }>(`${BASE}/${id}`, payload);
}

export function deactivateBancoTarjetaCaja(id: number): Promise<{ data: BancoTarjetaCajaItem }> {
  return api.patch<{ data: BancoTarjetaCajaItem }>(`${BASE}/${id}/desactivar`);
}
