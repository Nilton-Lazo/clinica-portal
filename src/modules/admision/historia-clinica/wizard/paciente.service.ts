import { api } from "../../../../shared/api";
import type { ItemResponse, PacienteFull } from "./types";

export const pacienteService = {
  show: (id: number, options?: { signal?: AbortSignal }) =>
    api.get<ItemResponse<PacienteFull>>(`/admision/pacientes/${id}`, options),
  create: (payload: unknown) => api.post<ItemResponse<PacienteFull>>(`/admision/pacientes`, payload),
  update: (id: number, payload: unknown) => api.put<ItemResponse<PacienteFull>>(`/admision/pacientes/${id}`, payload),
};
