import type { RecordStatus } from "../../../../../shared/types/recordStatus";
import type { PaginatedResponse, PaginationMeta } from "../../../../../shared/types/pagination";

export type { RecordStatus, PaginatedResponse, PaginationMeta };

export type ParamOption = {
  id: number;
  codigo: string;
  descripcion: string;
  estado: RecordStatus;
  created_at?: string;
  updated_at?: string;
};

export type ParamOptionQuery = {
  page?: number;
  per_page?: number;
  q?: string;
  status?: RecordStatus;
  sort?: string;
  sort_dir?: "asc" | "desc";
};

export type StatusFilter = "ALL" | RecordStatus;
