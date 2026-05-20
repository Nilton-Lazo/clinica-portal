import { useCallback, useEffect, useMemo, useState } from "react";
import type { DataGridColumnDef, SortDirection } from "../datagrid/types";
import { useClientGridSort } from "../datagrid/useClientGridSort";
import type { GridSortDefaults } from "../datagrid/gridSortCycle";
import { exportRowsToCsv } from "../datagrid/exportCsv";
import { useAuth } from "../auth/useAuth";

type Options<T> = {
  rows: T[];
  columns: DataGridColumnDef<T>[];
  enableClientSort?: boolean;
  onToggleSort?: (columnId: string) => void;
  sort?: string | null;
  sortDir?: SortDirection;
  defaultSort?: GridSortDefaults;
  exportFilename?: string;
  tableId?: string;
};

function loadHiddenColumnsFromStorage(storageKey: string | null): string[] {
  if (!storageKey || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

export function useTableShellState<T>(opts: Options<T>) {
  const {
    rows,
    columns,
    enableClientSort = true,
    onToggleSort,
    sort,
    sortDir,
    defaultSort,
    exportFilename,
    tableId,
  } = opts;

  const { user } = useAuth();
  const userId = user?.id ?? null;
  const resolvedTableId = tableId ?? exportFilename ?? null;
  const hiddenStorageKey =
    userId != null && resolvedTableId
      ? `datagrid:u${userId}:${resolvedTableId}:hidden`
      : null;

  const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>(() =>
    loadHiddenColumnsFromStorage(hiddenStorageKey)
  );

  useEffect(() => {
    if (!hiddenStorageKey) return;
    const loaded = loadHiddenColumnsFromStorage(hiddenStorageKey);
    setHiddenColumnIds((prev) => {
      if (prev.length === loaded.length && prev.every((id, i) => id === loaded[i])) {
        return prev;
      }
      return loaded;
    });
  }, [hiddenStorageKey]);

  useEffect(() => {
    if (!hiddenStorageKey || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(hiddenStorageKey, JSON.stringify(hiddenColumnIds));
    } catch {
      void 0;
    }
  }, [hiddenStorageKey, hiddenColumnIds]);

  const hasSortableColumn = useMemo(
    () => columns.some((c) => c.sortable === true),
    [columns]
  );

  const useClientSort = enableClientSort && !onToggleSort && hasSortableColumn;
  const clientSort = useClientGridSort(rows, columns, defaultSort ? { defaultSort } : undefined);

  const effectiveRows = useClientSort ? clientSort.rows : rows;
  const effectiveSort = useClientSort ? clientSort.sort : sort ?? null;
  const effectiveSortDir = useClientSort ? clientSort.sortDir : sortDir ?? "asc";
  const effectiveToggleSort = onToggleSort ?? (useClientSort ? clientSort.toggleSort : undefined);

  const toggleColumn = useCallback((columnId: string) => {
    setHiddenColumnIds((prev) =>
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]
    );
  }, []);

  const visibleColumns = useMemo(
    () => columns.filter((c) => !hiddenColumnIds.includes(c.id)),
    [columns, hiddenColumnIds]
  );

  const handleExport = useCallback(() => {
    if (!exportFilename) return;
    exportRowsToCsv(rows, visibleColumns, exportFilename);
  }, [exportFilename, rows, visibleColumns]);

  return {
    hiddenColumnIds,
    toggleColumn,
    visibleColumns,
    effectiveRows,
    effectiveSort,
    effectiveSortDir,
    effectiveToggleSort,
    handleExport,
  };
}
