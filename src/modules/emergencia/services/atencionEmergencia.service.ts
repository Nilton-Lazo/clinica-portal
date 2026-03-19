import { api } from "../../../shared/api";
import type { AtencionServicioLinea } from "../../admision/citas/agenda/types/atencionCita.types";

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
  servicios: AtencionServicioLineaDisplay[];
};

export async function getDatosAtencionEmergencia(registroId: number): Promise<DatosAtencionEmergenciaResponse> {
  const res = await api.get<DatosAtencionEmergenciaResponse>(`/emergencia/atencion/${registroId}`);
  return res.data ?? res;
}

export async function guardarAtencionEmergencia(registroId: number, payload: AtencionEmergenciaStorePayload): Promise<unknown> {
  const res = await api.post(`/emergencia/atencion/${registroId}/atencion`, payload);
  return res.data ?? res;
}

