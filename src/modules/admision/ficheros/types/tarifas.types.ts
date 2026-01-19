import type { RecordStatus } from "../../../../shared/types/recordStatus";
import type { PaginatedResponse, PaginationMeta } from "../../../../shared/types/pagination";

export type { RecordStatus, PaginatedResponse, PaginationMeta };

export type TipoIafaLookup = {
  id: number;
  codigo: string;
  descripcion: string;
};

export type IafaLookup = {
  id: number;
  codigo: string;
  tipo_iafa_id: number;
  razon_social: string;
  descripcion_corta: string;
  ruc: string;
};

export type Tarifa = {
  id: number;

  codigo: string;

  requiere_acreditacion: boolean;
  tarifa_base: boolean;

  descripcion_tarifa: string;

  iafa_id: number | null;

  factor_clinica: string;
  factor_laboratorio: string;
  factor_ecografia: string;
  factor_procedimientos: string;
  factor_rayos_x: string;
  factor_tomografia: string;
  factor_patologia: string;
  factor_medicina_fisica: string;
  factor_resonancia: string;
  factor_honorarios_medicos: string;
  factor_medicinas: string;
  factor_equipos_oxigeno: string;
  factor_banco_sangre: string;
  factor_mamografia: string;
  factor_densitometria: string;
  factor_psicoprofilaxis: string;
  factor_otros_servicios: string;

  factor_medicamentos_comerciales: string;
  factor_medicamentos_genericos: string;
  factor_material_medico: string;

  fecha_creacion: string;

  estado: RecordStatus;

  created_at?: string;
  updated_at?: string;
};

export type TarifasQuery = {
  page?: number;
  per_page?: number;
  q?: string;
  status?: RecordStatus;
};
