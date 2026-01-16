export type RecordStatus = "ACTIVO" | "INACTIVO" | "SUSPENDIDO";

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

export type TurnosQuery = {
  page?: number;
  per_page?: number;
  q?: string;
  status?: RecordStatus;
};
