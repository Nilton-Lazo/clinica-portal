import { api } from "../../../../shared/api";
import type { ItemResponse, MedicoLookupItem, PacienteFormCatalogos, PaisItem, UbigeoItem } from "./types";

type ListResponse<T> = { data: T[] };

type MedicosPage = {
  data: MedicoLookupItem[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
};

export const catalogoPacienteService = {
  pacienteForm: () => api.get<ItemResponse<PacienteFormCatalogos>>(`/admision/catalogos/paciente-form`),
  paises: () => api.get<ListResponse<PaisItem>>(`/admision/catalogos/paises`),
  ubigeos: () => api.get<ListResponse<UbigeoItem>>(`/admision/catalogos/ubigeos`),
  medicosActivos: () => api.get<MedicosPage>(`/admision/ficheros/medicos?status=ACTIVO&per_page=100&page=1`),
};
