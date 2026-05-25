import { api } from "../../../../../shared/api";
import { buildListQuery } from "../../../../../shared/datagrid";
import type { RecordStatus, PaginationMeta } from "../../emergencia/types/paramOption.types";

export type TipoDocumentoCajaOption = {
  id: number;
  codigo: string;
  descripcion: string;
  estado: RecordStatus;
};

export type NumeracionComprobanteCajaItem = {
  id: number;
  tipo_documento_id: number;
  tipo_documento_codigo: string;
  tipo_documento_descripcion: string;
  serie: string;
  numero: number;
  numero_formateado: string;
  estado: RecordStatus;
  codigo: string;
  descripcion: string;
};

export type NumeracionComprobanteCajaListResponse = {
  data: NumeracionComprobanteCajaItem[];
  meta: PaginationMeta;
};

export type NumeracionComprobanteCajaQuery = {
  page?: number;
  per_page?: number;
  q?: string;
  status?: RecordStatus;
  sort?: string;
  sort_dir?: "asc" | "desc";
};

export type NumeracionComprobanteCajaCreatePayload = {
  tipo_documento_id: number;
  serie: string;
  numero: number;
  estado?: RecordStatus;
};

export type NumeracionComprobanteCajaUpdatePayload = {
  tipo_documento_id: number;
  serie: string;
  numero: number;
  estado: RecordStatus;
};

const BASE = "/ficheros/parametros/caja/numeracion-comprobante";
const TIPOS_BASE = "/ficheros/parametros/caja/tipo-documento";

function buildQuery(query: NumeracionComprobanteCajaQuery): string {
  return buildListQuery({
    page: query.page ?? 1,
    per_page: query.per_page ?? 50,
    q: query.q,
    status: query.status,
    sort: query.sort,
    sort_dir: query.sort_dir,
  });
}

export function listNumeracionComprobanteCaja(query: NumeracionComprobanteCajaQuery): Promise<NumeracionComprobanteCajaListResponse> {
  return api.get<NumeracionComprobanteCajaListResponse>(`${BASE}${buildQuery(query)}`);
}

export function createNumeracionComprobanteCaja(payload: NumeracionComprobanteCajaCreatePayload): Promise<{ data: NumeracionComprobanteCajaItem }> {
  return api.post<{ data: NumeracionComprobanteCajaItem }>(BASE, payload);
}

export function updateNumeracionComprobanteCaja(
  id: number,
  payload: NumeracionComprobanteCajaUpdatePayload
): Promise<{ data: NumeracionComprobanteCajaItem }> {
  return api.put<{ data: NumeracionComprobanteCajaItem }>(`${BASE}/${id}`, payload);
}

export function deactivateNumeracionComprobanteCaja(id: number): Promise<{ data: NumeracionComprobanteCajaItem }> {
  return api.patch<{ data: NumeracionComprobanteCajaItem }>(`${BASE}/${id}/desactivar`);
}

export async function listTiposDocumentoCajaActivos(): Promise<TipoDocumentoCajaOption[]> {
  const res = await api.get<{ data: TipoDocumentoCajaOption[] }>(`${TIPOS_BASE}?page=1&per_page=50&status=ACTIVO`);
  return Array.isArray(res.data) ? res.data : [];
}
