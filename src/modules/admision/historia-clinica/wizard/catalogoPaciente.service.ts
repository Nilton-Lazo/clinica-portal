import { api } from "../../../../shared/api";
import type { ItemResponse, MedicoLookupItem, PacienteFormCatalogos, PaisItem, UbigeoItem } from "./types";

type PageMeta = { current_page: number; per_page: number; total: number; last_page: number };
type ListResponse<T> = { data: T[]; meta?: PageMeta };

type MedicosPage = {
  data: MedicoLookupItem[];
  meta: PageMeta;
};

const paisesList = (): Promise<PaisItem[]> =>
  api.get<{ data: PaisItem[] }>(`/admision/catalogos/paises/list`).then((r) => r.data ?? []);

const ubigeosFirstPage = (perPage = 250): Promise<UbigeoItem[]> =>
  api
    .get<ListResponse<UbigeoItem>>(`/admision/catalogos/ubigeos?page=1&per_page=${perPage}`)
    .then((r) => r.data ?? []);

export const catalogoPacienteService = {
  pacienteForm: () => api.get<ItemResponse<PacienteFormCatalogos>>(`/admision/catalogos/paciente-form`),
  paises: () => api.get<ListResponse<PaisItem>>(`/admision/catalogos/paises`),
  ubigeos: () => api.get<ListResponse<UbigeoItem>>(`/admision/catalogos/ubigeos`),
  paisesList,
  ubigeosFirstPage,
  medicosActivos: () => api.get<MedicosPage>(`/ficheros/medicos?status=ACTIVO&per_page=50&page=1`),
};
