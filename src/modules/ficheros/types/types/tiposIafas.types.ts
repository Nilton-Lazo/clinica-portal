import type { RecordStatus } from "../../../../shared/types/recordStatus";
import type { PaginatedResponse, PaginationMeta } from "../../../../shared/types/pagination";

export type { RecordStatus, PaginatedResponse, PaginationMeta };

export type TipoIafa = {
  id: number;
  codigo: string;
  descripcion: string;
  estado: RecordStatus;
  created_at?: string;
  updated_at?: string;
};

export type TiposIafasQuery = {
  page?: number;
  per_page?: number;
  q?: string;
  status?: RecordStatus;
};
