import { api } from "../../../shared/api";
import type { PacienteDetail } from "../../admision/historia-clinica/types/historiaClinica.types";
import type { RegistroEmergencia } from "../types/registroEmergencia.types";
import type {
  AtencionServicioLinea,
  AtencionServicioLineaDisplay,
} from "../../admision/citas/agenda/types/atencionCita.types";

export type AtencionEmergenciaStorePayload = {
  acudio_a_su_cita?: boolean;
  hora_asistencia?: string | null;
  paciente_plan_id?: number | null;
  parentesco_seguro?: string | null;
  titular_nombre?: string | null;
  monto_a_pagar?: number;
  servicios?: AtencionServicioLinea[];
};

export type DatosAtencionEmergenciaResponse = {
  registro: RegistroEmergencia;
  paciente: PacienteDetail;
  cuenta?: {
    id: number;
    nro_cuenta: string;
    estado: string | null;
    bloqueada: boolean;
  } | null;
  bloqueada_facturacion?: boolean;
  servicios: AtencionServicioLineaDisplay[];
};

export async function getDatosAtencionEmergencia(registroId: number): Promise<DatosAtencionEmergenciaResponse> {
  return api.get<DatosAtencionEmergenciaResponse>(`/emergencia/atencion/${registroId}`);
}

export async function guardarAtencionEmergencia(registroId: number, payload: AtencionEmergenciaStorePayload): Promise<unknown> {
  return api.post(`/emergencia/atencion/${registroId}/atencion`, payload);
}

