import type { PaginatedResponse, PaginationMeta } from "../../../shared/types/pagination";

export type { PaginatedResponse, PaginationMeta };

export type RegistroEmergencia = {
  id: number;
  orden: string;
  hora: string;
  numero_hc: string;
  apellidos_nombres: string;
  sexo: string;
  tipo_cliente: string;
  fecha: string;
  cuenta: string;
  medico_emergencia: string;
  medico_especialista: string;
  topico: string;
  numero_cuenta?: string | null;
  estado?: string;
};

export type RegistroEmergenciaQuery = {
  page?: number;
  per_page?: number;
  q?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
};
