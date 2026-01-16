import type { RecordStatus } from "../../../../shared/types/recordStatus";
import type { PaginatedResponse, PaginationMeta } from "../../../../shared/types/pagination";

export type { RecordStatus, PaginatedResponse, PaginationMeta };
export type TipoProfesionalClinica = "STAFF" | "EXTERNO";

export type EspecialidadLookup = {
  id: number;
  codigo: string;
  descripcion: string;
};

export type Medico = {
  id: number;

  codigo: string;

  cmp: string | null;
  rne: string | null;
  dni: string | null;

  tipo_profesional_clinica: TipoProfesionalClinica;

  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;

  direccion: string | null;
  centro_trabajo: string | null;
  fecha_nacimiento: string | null;

  ruc: string | null;

  especialidad_id: number;
  especialidad?: {
    id: number;
    codigo: string;
    descripcion: string;
  } | null;

  telefono: string | null;
  telefono_02: string | null;
  email: string | null;

  adicionales: number;
  extras: number;
  tiempo_promedio_por_paciente: number;

  estado: RecordStatus;

  nombre_completo?: string;

  created_at?: string;
  updated_at?: string;
};

export type MedicosQuery = {
  page?: number;
  per_page?: number;
  q?: string;
  status?: RecordStatus;
};
