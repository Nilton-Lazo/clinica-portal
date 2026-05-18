import { useMemo } from "react";
import type { DataGridColumnDef } from "./types";
import type { SortDirection } from "./types";
import { type GridSortDefaults, useGridSortState } from "./gridSortCycle";

function compareSortValues(a: string | number, b: string | number, dir: SortDirection): number {
  const factor = dir === "asc" ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") {
    if (a === b) return 0;
    return a < b ? -factor : factor;
  }
  return (
    String(a).localeCompare(String(b), "es", { numeric: true, sensitivity: "base" }) * factor
  );
}

export function buildColumnSortGetter<T>(columns: DataGridColumnDef<T>[]) {
  const byId = new Map<string, DataGridColumnDef<T>>();
  for (const col of columns) byId.set(col.id, col);

  return (row: T, columnId: string): string | number => {
    const col = byId.get(columnId);
    if (!col) return "";

    if (col.sortValue) {
      const v = col.sortValue(row);
      return v == null || v === "" ? "" : v;
    }
    if (col.exportValue) {
      const v = col.exportValue(row);
      return v == null || v === "" ? "" : v;
    }
    if (col.accessor) {
      const v = row[col.accessor];
      return v == null || v === "" ? "" : typeof v === "number" ? v : String(v);
    }

    const raw = (row as Record<string, unknown>)[columnId];
    if (raw == null || raw === "") return "";
    return typeof raw === "number" ? raw : String(raw);
  };
}

export function useClientGridSort<T>(
  rows: T[],
  columns: DataGridColumnDef<T>[],
  options?: { defaultSort?: GridSortDefaults }
) {
  const defaults: GridSortDefaults = options?.defaultSort ?? {
    column: "codigo",
    direction: "asc",
  };

  const { sort, sortDir, toggleSort } = useGridSortState(defaults);

  const getSortValue = useMemo(() => buildColumnSortGetter(columns), [columns]);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = getSortValue(a, sort);
      const bv = getSortValue(b, sort);
      return compareSortValues(av, bv, sortDir);
    });
    return copy;
  }, [rows, sort, sortDir, getSortValue]);

  return { rows: sortedRows, sort, sortDir, toggleSort };
}
