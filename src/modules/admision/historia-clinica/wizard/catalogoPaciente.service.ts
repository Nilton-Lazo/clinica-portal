import { api } from "../../../../shared/api";
import type { ItemResponse, MedicoLookupItem, PacienteFormCatalogos, PaisItem, UbigeoItem } from "./types";

type PageMeta = { current_page: number; per_page: number; total: number; last_page: number };
type ListResponse<T> = { data: T[]; meta?: PageMeta };

type MedicosPage = {
  data: MedicoLookupItem[];
  meta: PageMeta;
};

async function fetchAllPages<T>(path: string, perPage = 500): Promise<T[]> {
  const out: T[] = [];
  let page = 1;
  let last = 1;
  let guard = 0;

  while (page <= last) {
    const res = await api.get<ListResponse<T>>(`${path}${path.includes("?") ? "&" : "?"}page=${page}&per_page=${perPage}`);
    out.push(...(res.data ?? []));
    last = res.meta?.last_page ?? page;
    page += 1;
    guard += 1;
    if (guard > 2000) break;
  }

  return out;
}

export const catalogoPacienteService = {
  pacienteForm: () => api.get<ItemResponse<PacienteFormCatalogos>>(`/admision/catalogos/paciente-form`),
  paises: () => api.get<ListResponse<PaisItem>>(`/admision/catalogos/paises`),
  ubigeos: () => api.get<ListResponse<UbigeoItem>>(`/admision/catalogos/ubigeos`),
  paisesAll: () => fetchAllPages<PaisItem>(`/admision/catalogos/paises`),
  ubigeosAll: () => fetchAllPages<UbigeoItem>(`/admision/catalogos/ubigeos`),
  medicosActivos: () => api.get<MedicosPage>(`/admision/ficheros/medicos?status=ACTIVO&per_page=100&page=1`),
};
