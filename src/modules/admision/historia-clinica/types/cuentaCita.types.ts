import type { PaginatedResponse, PaginationMeta } from "../../../../shared/types/pagination";

export type { PaginatedResponse, PaginationMeta };

export type CuentaCitaListItem = {
  nro_cuenta: string;
  origen: string;
  origen_id: number;
  nr: string | null;
  hc: string | null;
  apellidos_nombres: string;
  fecha: string | null;
  estado: string;
  paciente_id: number | null;
  paciente_plan_id: number | null;
};

export type CuentasCitaQuery = {
  page?: number;
  per_page?: number;
  q?: string;
};
