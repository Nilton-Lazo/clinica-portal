import type { RecordStatus } from "../../../shared/types/recordStatus";
import type { PaginatedResponse, PaginationMeta } from "../../../shared/types/pagination";

export type { RecordStatus, PaginatedResponse, PaginationMeta };

export type TarifaPaqueteResumen = {
  id: number;
  codigo: string;
  descripcion_tarifa: string;
};

export type Paquete = {
  id: number;
  codigo: string;
  descripcion: string;
  tarifa_id: number;
  tarifa?: TarifaPaqueteResumen | null;
  precio_sin_igv: number;
  vigencia_actual: string;
  dias_hospitalizacion: number | null;
  cuenta_contabilidad: string | null;
  estado: RecordStatus;
  created_at?: string;
  updated_at?: string;
};

export type PaquetesQuery = {
  page?: number;
  per_page?: number;
  q?: string;
  status?: RecordStatus;
};

export type TarifaLookupPaquete = {
  id: number;
  codigo: string;
  descripcion_tarifa: string;
};
