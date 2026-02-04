import { api } from "../../../../shared/api";

export type PacienteUpsertPayload = Record<string, unknown>;

const BASE = "/admision/pacientes";

export async function createPaciente(payload: PacienteUpsertPayload) {
  return api.post(BASE, payload);
}

export async function updatePaciente(id: number, payload: PacienteUpsertPayload) {
  return api.put(`${BASE}/${id}`, payload);
}
