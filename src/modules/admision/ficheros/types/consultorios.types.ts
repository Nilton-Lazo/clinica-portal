export type RecordStatus = "ACTIVO" | "INACTIVO" | "SUSPENDIDO";

export type Consultorio = {
  id: number;
  abreviatura: string;
  descripcion: string;
  estado: RecordStatus;
  es_terceros: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PaginationMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type ConsultoriosQuery = {
  page?: number;
  per_page?: number;
  q?: string;
  status?: RecordStatus;
};
