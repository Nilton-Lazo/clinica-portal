import type { RecordStatus } from "../../../../shared/types/recordStatus";
import type { PaginatedResponse, PaginationMeta } from "../../../../shared/types/pagination";

export type { RecordStatus, PaginatedResponse, PaginationMeta };

export type Consultorio = {
  id: number;
  abreviatura: string;
  descripcion: string;
  estado: RecordStatus;
  es_tercero: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ConsultoriosQuery = {
  page?: number;
  per_page?: number;
  q?: string;
  status?: RecordStatus;
};
