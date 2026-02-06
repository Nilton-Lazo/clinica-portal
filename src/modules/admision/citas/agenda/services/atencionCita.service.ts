import { api } from "../../../../../shared/api";
import type { AtencionCitaData, AtencionCitaStorePayload } from "../types/atencionCita.types";

export async function getAtencionCitaData(citaId: number): Promise<AtencionCitaData> {
  return api.get<AtencionCitaData>(`/admision/citas/agenda-medica/${citaId}/atencion`);
}

export async function guardarAtencionCita(
  citaId: number,
  payload: AtencionCitaStorePayload
): Promise<AtencionCitaData> {
  return api.post<AtencionCitaData>(`/admision/citas/agenda-medica/${citaId}/atencion`, payload);
}
