import type { PaginationMeta } from "../types/pagination";

export type SortDirection = "asc" | "desc";

export type DataGridSortState = {
  sort: string | null;
  sortDir: SortDirection;
};

import type { ReactNode } from "react";

export type DataGridColumnDef<T> = {
  id: string;
  header: ReactNode;
  /** Etiqueta legible en exportación y selector de columnas */
  columnLabel?: string;
  accessor?: keyof T & string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  size?: number;
  minSize?: number;
  maxSize?: number;
  grow?: boolean;
  enableHiding?: boolean;
  resizable?: boolean;
  headerClassName?: string;
  cellClassName?: string;
  exportValue?: (row: T) => string | number | null | undefined;
  /** Valor usado al ordenar en cliente (si no hay sort en servidor) */
  sortValue?: (row: T) => string | number | null | undefined;
  cell?: (row: T) => ReactNode;
};

export type DataGridFetchParams = {
  page: number;
  per_page: number;
  q?: string;
  sort?: string;
  sort_dir?: SortDirection;
  status?: string;
  [key: string]: string | number | undefined;
};

export type DataGridQueryResult<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type DataGridSelectionMode = "single" | "multiple" | "none";
