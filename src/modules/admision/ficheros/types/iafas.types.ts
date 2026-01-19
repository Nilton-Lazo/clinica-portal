import type { RecordStatus } from "../../../../shared/types/recordStatus";
import type { PaginatedResponse, PaginationMeta } from "../../../../shared/types/pagination";

export type { RecordStatus, PaginatedResponse, PaginationMeta };

export type TipoIafaLookup = {
  id: number;
  codigo: string;
  descripcion: string;
};

export type Iafa = {
  id: number;

  codigo: string;

  tipo_iafa_id: number;
  tipo?: {
    id: number;
    codigo: string;
    descripcion: string;
  } | null;

  razon_social: string;
  descripcion_corta: string;
  ruc: string;

  direccion: string | null;
  representante_legal: string | null;
  telefono: string | null;
  pagina_web: string | null;

  fecha_inicio_cobertura: string;
  fecha_fin_cobertura: string;

  estado: RecordStatus;

  created_at?: string;
  updated_at?: string;
};

export type IafasQuery = {
  page?: number;
  per_page?: number;
  q?: string;
  status?: RecordStatus;
};

export type IafaLookup = {
    id: number;
    codigo: string;
    razon_social: string;
  };
  