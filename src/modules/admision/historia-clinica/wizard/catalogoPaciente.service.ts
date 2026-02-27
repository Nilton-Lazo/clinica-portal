import { api } from "../../../../shared/api";
import type { ItemResponse, MedicoLookupItem, PacienteFormCatalogos, PaisItem, UbigeoItem } from "./types";

type PageMeta = { current_page: number; per_page: number; total: number; last_page: number };
type ListResponse<T> = { data: T[]; meta?: PageMeta };

type MedicosPage = {
  data: MedicoLookupItem[];
  meta: PageMeta;
};

/** Lista completa de paises (nacionalidad). Una sola petición, cache en backend. */
const paisesList = (): Promise<PaisItem[]> =>
  api.get<{ data: PaisItem[] }>(`/admision/catalogos/paises/list`).then((r) => r.data ?? []);

/** Primera página de ubigeos para combos. Una sola petición; búsqueda adicional vía paises/ubigeos con q. */
const ubigeosFirstPage = (perPage = 250): Promise<UbigeoItem[]> =>
  api
    .get<ListResponse<UbigeoItem>>(`/admision/catalogos/ubigeos?page=1&per_page=${perPage}`)
    .then((r) => r.data ?? []);

export const catalogoPacienteService = {
  pacienteForm: () => api.get<ItemResponse<PacienteFormCatalogos>>(`/admision/catalogos/paciente-form`),
  paises: () => api.get<ListResponse<PaisItem>>(`/admision/catalogos/paises`),
  ubigeos: () => api.get<ListResponse<UbigeoItem>>(`/admision/catalogos/ubigeos`),
  /** Para wizard: una petición, listado completo de nacionalidades. */
  paisesList,
  /** Para wizard: una petición, primera página de distritos (suficiente para la mayoría de casos). */
  ubigeosFirstPage,
  medicosActivos: () => api.get<MedicosPage>(`/ficheros/medicos?status=ACTIVO&per_page=100&page=1`),
};
