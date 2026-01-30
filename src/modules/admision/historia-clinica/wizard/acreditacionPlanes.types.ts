import type { RecordStatus } from "../../../../shared/types/recordStatus";
import type { PaginatedResponse, PaginationMeta } from "../../../../shared/types/pagination";

export type { RecordStatus, PaginatedResponse, PaginationMeta };

export type TipoClienteLookup = {
  id: number;
  codigo: string;
  descripcion_tipo_cliente: string;
};

export type ParentescoSeguro = "TITULAR" | "CONYUGE" | "HIJO" | "PADRE" | "MADRE" | "OTRO";

export type AcreditacionPlan = {
  id: number;
  tipo_cliente_id: number;
  tipo_cliente: TipoClienteLookup | null;
  parentesco_seguro: ParentescoSeguro | null;
  fecha_afiliacion: string | null;
  estado: RecordStatus;
};
