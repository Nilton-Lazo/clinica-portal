import type { PaginatedResponse } from "../../../../../shared/types/pagination";
import type { RecordStatus } from "../../../../../shared/types/recordStatus";

export type AgendaEspecialidadOption = {
  id: number;
  codigo: string;
  descripcion: string;
};

export type AgendaMedicoOption = {
  id: number;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
};

export type AgendaOpciones = {
  especialidades: AgendaEspecialidadOption[];
  medicos: AgendaMedicoOption[];
};

export type AgendaProgramacion = {
  id: number;
  fecha: string;
  cupos: number;
  especialidad?: { id: number; codigo: string; descripcion: string } | null;
  medico?: { id: number; nombres: string; apellido_paterno: string; apellido_materno: string } | null;
  consultorio?: { id: number; abreviatura: string; descripcion: string } | null;
  turno?: { id: number; codigo: string; descripcion: string; hora_inicio: string; hora_fin: string } | null;
};

export type AgendaSlotsResponse = {
  programacion: AgendaProgramacion | null;
  slots_base: string[];
  slots_adicional: string[];
  slots_extra: string[];
  slots_tomados: string[];
  tiempo_promedio: number;
  adicionales: number;
  extras: number;
};

export type AgendaCita = {
  id: number;
  codigo: string;
  hora: string;
  hc: string | null;
  nr: string | null;
  paciente_nombre: string;
  cuenta: string | null;
  iafa_id: number | null;
  iafa?: { id: number; codigo: string; descripcion_corta?: string; razon_social?: string } | null;
  motivo: string | null;
  observacion: string | null;
  estado: RecordStatus;
};

export type AgendaCitasPaginated = PaginatedResponse<AgendaCita>;

export type AgendaCitasQuery = {
  fecha?: string;
  especialidad_id?: number;
  medico_id?: number;
  per_page?: number;
  page?: number;
};

export type AgendaCitaPayload = {
  programacion_medica_id: number;
  paciente_id: number;
  hora: string;
  motivo?: string;
  observacion?: string;
  autorizacion_siteds?: string;
  cuenta?: string;
  iafa_id?: number | null;
};

export type PacienteAgenda = {
  id: number;
  hc: string;
  nr: string | null;
  nombre_completo: string;
  sexo: string | null;
  edad: number | null;
  titular_nombre: string | null;
  iafas: Array<{ id: number; descripcion: string }>;
};
