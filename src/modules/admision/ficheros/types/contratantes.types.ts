import type { RecordStatus } from "../../../../shared/types/recordStatus";
import type { PaginatedResponse, PaginationMeta } from "../../../../shared/types/pagination";

export type { RecordStatus, PaginatedResponse, PaginationMeta };

export type Contratante = {
  id: number;
  codigo: string;
  razon_social: string;
  ruc: string | null;
  telefono: string | null;
  direccion: string | null;
  estado: RecordStatus;
  created_at?: string;
  updated_at?: string;
};

export type ContratantesQuery = {
  page?: number;
  per_page?: number;
  q?: string;
  status?: RecordStatus;
};
