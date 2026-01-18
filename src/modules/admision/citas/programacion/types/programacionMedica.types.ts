import type { PaginatedResponse } from "../../../../../shared/types/pagination";
import type { RecordStatus } from "../../../../../shared/types/recordStatus";

export type TipoProgramacionMedica = "NORMAL" | "EXTRAORDINARIA";
export type ModalidadFechasProgramacion = "DIARIA" | "ALEATORIA" | "RANGO";

export type EspecialidadLookup = {
  id: number;
  codigo: string;
  descripcion: string;
  estado?: RecordStatus;
};

export type MedicoLookup = {
  id: number;
  codigo?: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  tiempo_promedio_por_paciente?: number | null;
  estado?: RecordStatus;
  especialidad_id?: number | null;
  especialidad?: EspecialidadLookup | null;
  especialidades?: EspecialidadLookup[] | null;
};

export type ConsultorioLookup = {
  id: number;
  abreviatura: string;
  descripcion: string;
  estado?: RecordStatus;
};

export type TurnoLookup = {
  id: number;
  codigo: string;
  descripcion: string;
  duracion_minutos?: number | null;
  estado?: RecordStatus;
};

export type ProgramacionMedica = {
  id: number;
  codigo: string;
  fecha: string;
  cupos: number;
  tipo: TipoProgramacionMedica;
  estado: RecordStatus;

  medico?: MedicoLookup | null;
  especialidad?: EspecialidadLookup | null;
  consultorio?: ConsultorioLookup | null;
  turno?: TurnoLookup | null;

  medico_id: number;
  especialidad_id: number;
  consultorio_id: number;
  turno_id: number;

  created_at?: string;
  updated_at?: string;
};

export type ProgramacionMedicaListFilters = {
  from?: string;
  to?: string;
  status?: RecordStatus;
  q?: string;
  per_page?: number;
  page?: number;
};

export type CuposResponse = {
  cupos: number;
  duracion_minutos: number;
  tiempo_promedio_por_paciente: number;
};

export type ProgramacionMedicaStorePayload = {
  modalidad_fechas: ModalidadFechasProgramacion;

  fecha?: string | null;
  fechas?: string[] | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;

  especialidad_id: number;
  medico_id: number;
  consultorio_id: number;
  turno_id: number;

  tipo: TipoProgramacionMedica;
  estado: RecordStatus;
};

export type ProgramacionMedicaUpdatePayload = {
  fecha: string;

  especialidad_id: number;
  medico_id: number;
  consultorio_id: number;
  turno_id: number;

  tipo: TipoProgramacionMedica;
  estado: RecordStatus;
};

export type ProgramacionMedicaPaginated = PaginatedResponse<ProgramacionMedica>;
