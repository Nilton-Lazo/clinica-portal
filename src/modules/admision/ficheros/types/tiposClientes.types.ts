import type { RecordStatus } from "../../../../shared/types/recordStatus";
import type { PaginatedResponse, PaginationMeta } from "../../../../shared/types/pagination";

export type { RecordStatus, PaginatedResponse, PaginationMeta };

export type TarifaLookup = {
  id: number;
  codigo: string;
  descripcion_tarifa: string;
  iafa_id: number;
};

export type ContratanteLookup = {
  id: number;
  codigo: string;
  razon_social: string;
};

export type IafaLookup = {
  id: number;
  codigo: string;
  razon_social: string;
};

export type TipoCliente = {
  id: number;

  codigo: string;

  tarifa_id: number;
  iafa_id: number;
  contratante_id: number;

  descripcion_tipo_cliente: string;

  estado: RecordStatus;

  created_at?: string;
  updated_at?: string;
};

export type TiposClientesQuery = {
  page?: number;
  per_page?: number;
  q?: string;
  status?: RecordStatus;
};
