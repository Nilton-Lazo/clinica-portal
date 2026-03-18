import type { RecordStatus } from "../../../../shared/types/recordStatus";
import type { PaginatedResponse, PaginationMeta } from "../../../../shared/types/pagination";

export type { RecordStatus, PaginatedResponse, PaginationMeta };

export type TipoClienteLookup = {
  id: number;
  codigo: string;
  descripcion_tipo_cliente: string;
  iafa_id?: number | null;
  contratante_id?: number | null;
};

export type ParentescoSeguro =
  | "NO_DEFINIDO"
  | "TITULAR"
  | "CONYUGE"
  | "PADRE"
  | "MADRE"
  | "HIJO"
  | "HIJA"
  | "HERMANO"
  | "HERMANA"
  | "HIJO_INCAPACITADO"
  | "OTRO";

export type IafaLookup = {
  id: number;
  codigo: string;
  razon_social: string;
  descripcion_corta: string;
};

export type ContratanteLookup = {
  id: number;
  codigo: string;
  razon_social: string;
};

export type AcreditacionPlan = {
  id: number;
  tipo_cliente_id: number;
  tipo_cliente: TipoClienteLookup | null;
  parentesco_seguro: ParentescoSeguro | null;
  fecha_afiliacion: string | null;
  estado: RecordStatus;
  tarifa_es_precio_directo?: boolean;
  tarifa_id: number | null;
  tarifa_codigo: string | null;
  tarifa_descripcion: string | null;
};
