import type { PaginatedResponse, PaginationMeta } from "../../../../shared/types/pagination";
import type { RecordStatus } from "../../../../shared/types/recordStatus";

export type { PaginatedResponse, PaginationMeta, RecordStatus };

export type TarifaOperativa = {
  id: number;
  codigo: string;
  descripcion_tarifa: string;
  iafa_id: number | null;
  estado: RecordStatus;
  tarifa_base?: boolean;
};

export type TarifaBase = {
  id: number;
  codigo: string;
  descripcion_tarifa: string;
  tarifa_base: boolean;
  estado: RecordStatus;
};

export type TarifaServicioListItem = {
  id: number;
  codigo: string;
  nomenclador: string | null;
  descripcion: string;
  precio_sin_igv: string;
  unidad: string;
  estado: RecordStatus;
  categoria_id: number;
  categoria_codigo: string;
  categoria_nombre: string;
  subcategoria_id: number;
  subcategoria_codigo: string;
  subcategoria_nombre: string;
};

export type TarifarioServiciosQuery = {
  page?: number;
  per_page?: number;
  q?: string;
  codigo?: string;
  nomenclador?: string;
  categoria_id?: number;
  subcategoria_id?: number;
  status?: RecordStatus;
};

export type TarifaCategoria = {
  id: number;
  tarifa_id: number;
  codigo: string;
  descripcion: string;
  estado: RecordStatus;
};

export type TarifaCategoriaLookup = {
  id: number;
  codigo: string;
  descripcion: string;
  estado: RecordStatus;
};

export type TarifaSubcategoria = {
  id: number;
  tarifa_id: number;
  categoria_id: number;
  codigo: string;
  descripcion: string;
  estado: RecordStatus;
};

export type TarifaSubcategoriaLookup = {
  id: number;
  codigo: string;
  descripcion: string;
  estado: RecordStatus;
};

export type GrupoServicioLookup = {
  id: number;
  codigo: string;
  descripcion: string;
  abrev: string | null;
};

export type TarifaServicioCrud = {
  id: number;
  tarifa_id: number;
  categoria_id: number;
  subcategoria_id: number;
  servicio_codigo: string;
  codigo: string;
  nomenclador: string | null;
  descripcion: string;
  precio_sin_igv: string;
  unidad: string;
  grupo_codigo: string | null;
  grupo_descripcion: string | null;
  grupo_abrev: string | null;
  estado: RecordStatus;
};

export type TarifaTreeServicio = {
  id: number;
  servicio_codigo: string;
  codigo: string;
  nomenclador: string | null;
  descripcion: string;
  precio_sin_igv: string;
  unidad: string;
};

export type TarifaTreeSubcategoria = {
  id: number;
  codigo: string;
  nombre: string;
  servicios: TarifaTreeServicio[];
};

export type TarifaTreeCategoria = {
  id: number;
  codigo: string;
  nombre: string;
  subcategorias: TarifaTreeSubcategoria[];
};

export type TarifaBaseTree = {
  tarifa_base: {
    id: number;
    codigo: string;
    descripcion_tarifa: string;
  };
  tree: TarifaTreeCategoria[];
};

export type TarifaCloneResult = {
  base: { id: number; codigo: string };
  target: { id: number; codigo: string };
  selection: {
    clone_all: boolean;
    categorias: number;
    subcategorias: number;
    servicios: number;
  };
  applied: {
    categorias: number;
    subcategorias: number;
    servicios: number;
    nomencladores_nulled_por_conflicto: number;
  };
};

export type Notice = { type: "success" | "error"; text: string } | null;

export type PropagacionResultado = {
  propagados: number;
  omitidos: number;
  creados_con_codigo_diferente: number;
  detalle: {
    creados: Array<{ tipo: string; tarifa_descripcion: string; mensaje: string }>;
    omitidos: Array<{ tipo: string; tarifa_descripcion: string; mensaje: string }>;
    creados_con_codigo_diferente: Array<{
      tipo: string;
      tarifa_descripcion: string;
      mensaje: string;
      codigo_base: string;
      codigo_usado: string;
    }>;
  };
  tiene_alertas: boolean;
};
