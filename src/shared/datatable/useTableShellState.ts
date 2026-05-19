import { useCallback, useMemo, useState } from "react";
import type { DataGridColumnDef, SortDirection } from "../datagrid/types";
import { useClientGridSort } from "../datagrid/useClientGridSort";
import type { GridSortDefaults } from "../datagrid/gridSortCycle";
import { exportRowsToCsv } from "../datagrid/exportCsv";

type Options<T> = {
  rows: T[];
  columns: DataGridColumnDef<T>[];
  enableClientSort?: boolean;
  onToggleSort?: (columnId: string) => void;
  sort?: string | null;
  sortDir?: SortDirection;
  defaultSort?: GridSortDefaults;
  exportFilename?: string;
};

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
  } = opts;

  const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>([]);

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
