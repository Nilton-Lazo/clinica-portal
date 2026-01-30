import { api } from "../../../../shared/api";
import type { ItemResponse, PacienteFormCatalogos } from "./types";

export const catalogoPacienteService = {
  pacienteForm: () => api.get<ItemResponse<PacienteFormCatalogos>>(`/admision/catalogos/paciente-form`),
};
