import { api } from "../../../../shared/api";
import type {
  PaginatedResponse,
  TarifaBase,
  TarifaBaseTree,
  TarifaCategoria,
  TarifaCategoriaLookup,
  GrupoServicioLookup,
  TarifaOperativa,
  TarifaServicioCrud,
  TarifaServicioListItem,
  TarifaSubcategoria,
  TarifaSubcategoriaLookup,
  TarifarioServiciosQuery,
  RecordStatus,
  TarifaCloneResult,
} from "../types/tarifario.types";

function qs(params: Record<string, string | number | null | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export async function listTarifasOperativas(q?: string): Promise<TarifaOperativa[]> {
  const res = await api.get<{ data: TarifaOperativa[] }>(
    `/facturacion/tarifario/tarifas/operativas${qs({ q })}`
  );
  return res.data ?? [];
}

/** Todas las tarifas activas incluyendo el base. Solo para Facturación → Tarifario. */
export async function listTarifasParaGestionTarifario(q?: string): Promise<TarifaOperativa[]> {
  const res = await api.get<{ data: TarifaOperativa[] }>(
    `/facturacion/tarifario/tarifas/para-gestion-tarifario${qs({ q })}`
  );
  return res.data ?? [];
}

export async function getTarifaBase(): Promise<TarifaBase> {
  const res = await api.get<{ data: TarifaBase }>("/facturacion/tarifario/tarifas/base");
  return res.data;
}

export async function getTarifaBaseTree(): Promise<TarifaBaseTree> {
  const res = await api.get<{ data: TarifaBaseTree }>(
    "/facturacion/tarifario/tarifas/base/arbol"
  );
  return res.data;
}

export async function listTarifaServicios(
  tarifaId: number,
  query: TarifarioServiciosQuery
): Promise<PaginatedResponse<TarifaServicioListItem>> {
  const res = await api.get<PaginatedResponse<TarifaServicioListItem>>(
    `/facturacion/tarifario/tarifas/${tarifaId}/servicios${qs({
      page: query.page,
      per_page: query.per_page,
      q: query.q,
      codigo: query.codigo,
      nomenclador: query.nomenclador,
      categoria_id: query.categoria_id,
      subcategoria_id: query.subcategoria_id,
      status: query.status,
    })}`
  );
  return res;
}

export async function cloneTarifaFromBase(
  tarifaId: number,
  payload: {
    clone_all: boolean;
    categoria_ids?: number[];
    subcategoria_ids?: number[];
    servicio_ids?: number[];
  }
): Promise<TarifaCloneResult> {
  const res = await api.post<{ data: TarifaCloneResult }>(
    `/facturacion/tarifario/tarifas/${tarifaId}/clonar-desde-base`,
    payload
  );
  return res.data;
}

export async function lookupGruposServicio(): Promise<GrupoServicioLookup[]> {
  const res = await api.get<{ data: GrupoServicioLookup[] }>(
    "/facturacion/tarifario/grupos-servicio"
  );
  return res.data ?? [];
}

export async function listCategorias(
  tarifaId: number,
  query: { page?: number; per_page?: number; q?: string; status?: RecordStatus }
): Promise<PaginatedResponse<TarifaCategoria>> {
  const res = await api.get<PaginatedResponse<TarifaCategoria>>(
    `/facturacion/tarifario/tarifas/${tarifaId}/categorias${qs({
      page: query.page,
      per_page: query.per_page,
      q: query.q,
      status: query.status,
    })}`
  );
  return res;
}

export async function lookupCategorias(
  tarifaId: number,
  onlyActive = true
): Promise<TarifaCategoriaLookup[]> {
  const res = await api.get<{ data: TarifaCategoriaLookup[] }>(
    `/facturacion/tarifario/tarifas/${tarifaId}/categorias/lookup${qs({
      only_active: onlyActive ? 1 : 0,
    })}`
  );
  return res.data ?? [];
}

export async function getNextCategoriaCodigo(tarifaId: number): Promise<{ codigo: string }> {
  const res = await api.get<{ data: { codigo: string } }>(
    `/facturacion/tarifario/tarifas/${tarifaId}/categorias/next-codigo`
  );
  return res.data;
}

export async function createCategoria(
  tarifaId: number,
  payload: { descripcion: string; estado?: RecordStatus }
): Promise<TarifaCategoria> {
  const res = await api.post<{ data: TarifaCategoria }>(
    `/facturacion/tarifario/tarifas/${tarifaId}/categorias`,
    payload
  );
  return res.data;
}

export async function updateCategoria(
  tarifaId: number,
  categoriaId: number,
  payload: { descripcion: string; estado: RecordStatus }
): Promise<TarifaCategoria> {
  const res = await api.put<{ data: TarifaCategoria }>(
    `/facturacion/tarifario/tarifas/${tarifaId}/categorias/${categoriaId}`,
    payload
  );
  return res.data;
}

export async function deactivateCategoria(
  tarifaId: number,
  categoriaId: number
): Promise<TarifaCategoria> {
  const res = await api.patch<{ data: TarifaCategoria }>(
    `/facturacion/tarifario/tarifas/${tarifaId}/categorias/${categoriaId}/desactivar`
  );
  return res.data;
}

export async function listSubcategorias(
  tarifaId: number,
  query: {
    page?: number;
    per_page?: number;
    q?: string;
    status?: RecordStatus;
    categoria_id?: number;
  }
): Promise<PaginatedResponse<TarifaSubcategoria>> {
  const res = await api.get<PaginatedResponse<TarifaSubcategoria>>(
    `/facturacion/tarifario/tarifas/${tarifaId}/subcategorias${qs({
      page: query.page,
      per_page: query.per_page,
      q: query.q,
      status: query.status,
      categoria_id: query.categoria_id,
    })}`
  );
  return res;
}

export async function lookupSubcategorias(
  tarifaId: number,
  categoriaId: number | null,
  onlyActive = true
): Promise<TarifaSubcategoriaLookup[]> {
  if (!categoriaId) return [];
  const res = await api.get<{ data: TarifaSubcategoriaLookup[] }>(
    `/facturacion/tarifario/tarifas/${tarifaId}/subcategorias/lookup${qs({
      categoria_id: categoriaId,
      only_active: onlyActive ? 1 : 0,
    })}`
  );
  return res.data ?? [];
}

export async function getNextSubcategoriaCodigo(
  tarifaId: number,
  categoriaId: number
): Promise<{ codigo: string }> {
  const res = await api.get<{ data: { codigo: string } }>(
    `/facturacion/tarifario/tarifas/${tarifaId}/subcategorias/next-codigo${qs({
      categoria_id: categoriaId,
    })}`
  );
  return res.data;
}

export async function createSubcategoria(
  tarifaId: number,
  payload: { categoria_id: number; descripcion: string; estado?: RecordStatus }
): Promise<TarifaSubcategoria> {
  const res = await api.post<{ data: TarifaSubcategoria }>(
    `/facturacion/tarifario/tarifas/${tarifaId}/subcategorias`,
    payload
  );
  return res.data;
}

export async function updateSubcategoria(
  tarifaId: number,
  subcategoriaId: number,
  payload: { descripcion: string; estado: RecordStatus }
): Promise<TarifaSubcategoria> {
  const res = await api.put<{ data: TarifaSubcategoria }>(
    `/facturacion/tarifario/tarifas/${tarifaId}/subcategorias/${subcategoriaId}`,
    payload
  );
  return res.data;
}

export async function deactivateSubcategoria(
  tarifaId: number,
  subcategoriaId: number
): Promise<TarifaSubcategoria> {
  const res = await api.patch<{ data: TarifaSubcategoria }>(
    `/facturacion/tarifario/tarifas/${tarifaId}/subcategorias/${subcategoriaId}/desactivar`
  );
  return res.data;
}

export async function listServiciosCrud(
  tarifaId: number,
  query: {
    page?: number;
    per_page?: number;
    q?: string;
    status?: RecordStatus;
    categoria_id?: number;
    subcategoria_id?: number;
    grupo_codigo?: string | null;
  }
): Promise<PaginatedResponse<TarifaServicioCrud>> {
  const res = await api.get<PaginatedResponse<TarifaServicioCrud>>(
    `/facturacion/tarifario/tarifas/${tarifaId}/servicios-crud${qs({
      page: query.page,
      per_page: query.per_page,
      q: query.q,
      status: query.status,
      categoria_id: query.categoria_id,
      subcategoria_id: query.subcategoria_id,
      grupo_codigo: query.grupo_codigo ?? undefined,
    })}`
  );
  return res;
}

export async function getNextServicioCodigo(
  tarifaId: number,
  categoriaId: number,
  subcategoriaId: number
): Promise<{ codigo: string; servicio_codigo: string }> {
  const res = await api.get<{ data: { codigo: string; servicio_codigo: string } }>(
    `/facturacion/tarifario/tarifas/${tarifaId}/servicios-crud/next-codigo${qs({
      categoria_id: categoriaId,
      subcategoria_id: subcategoriaId,
    })}`
  );
  return res.data;
}

export async function createServicio(
  tarifaId: number,
  payload: {
    categoria_id: number;
    subcategoria_id: number;
    descripcion: string;
    nomenclador?: string | null;
    precio_sin_igv: number;
    unidad: number;
    grupo_codigo?: string | null;
    estado?: RecordStatus;
  }
): Promise<TarifaServicioCrud> {
  const res = await api.post<{ data: TarifaServicioCrud }>(
    `/facturacion/tarifario/tarifas/${tarifaId}/servicios-crud`,
    payload
  );
  return res.data;
}

export async function updateServicio(
  tarifaId: number,
  servicioId: number,
  payload: {
    descripcion: string;
    nomenclador?: string | null;
    precio_sin_igv: number;
    unidad: number;
    grupo_codigo?: string | null;
    estado: RecordStatus;
  }
): Promise<TarifaServicioCrud> {
  const res = await api.put<{ data: TarifaServicioCrud }>(
    `/facturacion/tarifario/tarifas/${tarifaId}/servicios-crud/${servicioId}`,
    payload
  );
  return res.data;
}

export async function deactivateServicio(
  tarifaId: number,
  servicioId: number
): Promise<TarifaServicioCrud> {
  const res = await api.patch<{ data: TarifaServicioCrud }>(
    `/facturacion/tarifario/tarifas/${tarifaId}/servicios-crud/${servicioId}/desactivar`
  );
  return res.data;
}
