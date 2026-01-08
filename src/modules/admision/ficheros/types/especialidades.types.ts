export type RecordStatus = "ACTIVO" | "INACTIVO" | "SUSPENDIDO";

export type Especialidad = {
  id: number;
  codigo: string;
  descripcion: string;
  estado: RecordStatus;
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

export type EspecialidadesQuery = {
  page?: number;
  per_page?: number;
  q?: string;
  status?: RecordStatus;
};
