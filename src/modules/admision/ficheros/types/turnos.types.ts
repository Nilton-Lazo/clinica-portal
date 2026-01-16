import type { RecordStatus } from "../../../../shared/types/recordStatus";
import type { PaginatedResponse, PaginationMeta } from "../../../../shared/types/pagination";

export type { RecordStatus, PaginatedResponse, PaginationMeta };
export type TipoTurno = "NORMAL" | "ADICIONAL" | "EXCLUSIVO";
export type JornadaTurno = "MANANA" | "TARDE" | "NOCHE";

export type Turno = {
  id: number;

  codigo: string;

  hora_inicio: string | null;
  hora_fin: string | null;

  duracion_minutos: number;
  duracion_hhmm?: string;

  descripcion: string;

  tipo_turno: TipoTurno;
  jornada: JornadaTurno;

  estado: RecordStatus;

  created_at?: string;
  updated_at?: string;
};

export type TurnosQuery = {
  page?: number;
  per_page?: number;
  q?: string;
  status?: RecordStatus;
};
