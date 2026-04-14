export type PresupuestoPacientePlan = {
  pacientePlanId: number;
  tipoClienteId: number;
  label: string;
  iafaId: number | null;
  iafaLabel: string;
  tarifaId: number | null;
  tarifaCodigo: string | null;
  tarifaDescripcion: string | null;
  tarifaEsPrecioDirecto: boolean;
};

export type PresupuestoPacienteDetalle = {
  id: number;
  hc: string;
  nr: string | null;
  nombre_completo: string;
  planes: PresupuestoPacientePlan[];
  tipo_paciente: string | null;
  parentesco_seguro: string | null;
};
