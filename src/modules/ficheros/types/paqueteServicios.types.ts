import type { RecordStatus } from "../../../shared/types/recordStatus";

export type TarifaLookup = {
  id: number;
  codigo: string;
  descripcion_tarifa: string;
};

export type PaqueteLookup = {
  id: number;
  codigo: string;
  descripcion: string;
  tarifa_id: number;
  estado: RecordStatus;
};

export type TreeServicio = {
  id: number;
  codigo: string;
  descripcion: string;
  precio_sin_igv: string;
  unidad: string;
};

export type TreeSubcategoria = {
  id: number;
  codigo: string;
  nombre: string;
  servicios: TreeServicio[];
};

export type TreeCategoria = {
  id: number;
  codigo: string;
  nombre: string;
  subcategorias: TreeSubcategoria[];
};

export type TarifaServiciosTree = {
  tarifa: TarifaLookup;
  tree: TreeCategoria[];
};

export type PaqueteServicioItem = {
  id: number;
  codigo: string;
  descripcion: string;
  precio_sin_igv: string;
  unidad: string;
  categoria_codigo: string;
  categoria_nombre: string;
  subcategoria_codigo: string;
  subcategoria_nombre: string;
};
