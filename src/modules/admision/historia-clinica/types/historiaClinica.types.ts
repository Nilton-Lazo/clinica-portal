import type { RecordStatus } from "../../../../shared/types/recordStatus";
import type { PaginatedResponse, PaginationMeta } from "../../../../shared/types/pagination";

export type { RecordStatus, PaginatedResponse, PaginationMeta };

export type PacienteListItem = {
  id: number;

  hc: string;
  nombre_completo: string;

  parentesco_seguro: string | null;
  nr: string | null;

  sexo: string | null;
  fecha_nacimiento: string | null;

  created_at?: string;
  updated_at?: string;

  estado: RecordStatus;
};

export type PacienteContactoEmergenciaPayload = {
  nombres: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  parentesco_emergencia: string | null;
  celular: string | null;
  telefono: string | null;
  observaciones: string | null;
};

export type PacienteUpsertPayload = {
  tipo_documento: string;
  numero_documento: string | null;

  nombres: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;

  estado_civil: string | null;
  sexo: string | null;
  fecha_nacimiento: string | null;

  nacionalidad_iso2: string | null;
  ubigeo_nacimiento: string | null;
  direccion: string | null;
  ubigeo_domicilio: string | null;

  parentesco_seguro: string | null;
  titular_nombre: string | null;

  celular: string | null;
  telefono: string | null;
  email: string | null;

  medico_tratante_id: number | null;

  tipo_sangre: string | null;
  tipo_paciente: string | null;

  ocupacion: string | null;

  medio_informacion: string | null;
  medio_informacion_detalle: string | null;

  ubicacion_archivo_hc: string | null;

  estado: RecordStatus;

  contacto_emergencia: PacienteContactoEmergenciaPayload | null;
};

export type PacienteDetail = PacienteUpsertPayload & {
  id: number;

  hc: string;
  nr: string | null;

  created_at: string;
  updated_at: string;

  nombre_completo?: string;
  edad?: number | null;
};

export type PacientesQuery = {
  page?: number;
  per_page?: number;
  q?: string;
  status?: RecordStatus;
  filiacion_from?: string;
  filiacion_to?: string;
  sort?: string;
  sort_dir?: "asc" | "desc";
};

export type SelectOption = { value: string; label: string };

export type PacienteFormCatalogs = {
  tipos_documento: SelectOption[];
  estados_civiles: SelectOption[];
  sexos: SelectOption[];
  parentescos_seguro: SelectOption[];
  parentescos_emergencia: SelectOption[];
  tipos_paciente: SelectOption[];
  ocupaciones: SelectOption[];
  medios_informacion: SelectOption[];
  tipos_sangre: SelectOption[];
};
