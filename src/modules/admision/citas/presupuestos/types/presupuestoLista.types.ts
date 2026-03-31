import type { PaginatedResponse, PaginationMeta } from "../../../../../shared/types/pagination";

export type PresupuestoDocumentoEstado = "VIGENTE" | "UTILIZADO" | "VENCIDO" | "ANULADO";

export type PresupuestoListItem = {
  id: number;
  codigo: string;
  hc: string;
  nr: string | null;
  nombre_completo: string | null;
  plan?: string | null;
  vigencia_hasta: string | null;
  estado: string;
  created_at?: string | null;
};

export type PresupuestoListaQuery = {
  page?: number;
  per_page?: number;
  q?: string;
  vigencia_desde?: string;
  vigencia_hasta?: string;
  estado?: PresupuestoDocumentoEstado;
};

export type PresupuestoListaResponse = PaginatedResponse<PresupuestoListItem>;

export type { PaginationMeta };
