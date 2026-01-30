export type RecordStatus = "ACTIVO" | "INACTIVO" | "SUSPENDIDO";

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

export type TipoClienteListItem = {
  id: number;
  codigo: string;
  descripcion_tipo_cliente: string;
  estado: RecordStatus;
};

export type AcreditacionPlanItem = {
  id: number;
  paciente_id: number;
  tipo_cliente_id: number;
  parentesco_seguro: string | null;
  fecha_afiliacion: string;
  estado: RecordStatus;
  tipoCliente?: TipoClienteListItem;
};

export type AddPlanPayload = {
  tipo_cliente_id: number;
};

export type AddPlanResponse = {
  data: AcreditacionPlanItem;
};

export type DeactivatePlanResponse = {
  data: AcreditacionPlanItem;
};
