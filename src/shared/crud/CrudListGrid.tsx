import * as React from "react";
import type { MouseEvent } from "react";
import type { PaginationMeta } from "../types/pagination";
import {
  DataGrid,
  type DataGridColumnDef,
  type SortDirection,
  exportRowsToCsv,
  useClientGridSort,
} from "../datagrid";
import { DataGridFooterActions } from "../datagrid/DataGridFooterActions";
import { PaginationFooter } from "./PaginationFooter";

export function CrudListGrid<T>(props: {
  rows: T[];
  columns: DataGridColumnDef<T>[];
  loading: boolean;
  error?: string | null;
  meta: PaginationMeta;
  selectedId?: string | number | null;
  getRowId: (row: T) => string | number;
  onSelect: (row: T, event?: MouseEvent) => void;
  onDoubleClick?: (row: T) => void;
  onContextMenu?: (row: T, event: MouseEvent) => void;
  onRowPointerEnter?: (row: T) => void;
  emptyText?: string;
  exportFilename?: string;
  onRefresh?: () => void;
  sort?: string | null;
  sortDir?: SortDirection;
  onToggleSort?: (columnId: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
  heightMode?: "fill" | "hug";
  className?: string;
  enableColumnPicker?: boolean;
  enableExport?: boolean;
  enableClientSort?: boolean;
}) {
  const {
    rows,
    columns,
    loading,
    error,
    meta,
    selectedId,
    getRowId,
    onSelect,
    onDoubleClick,
    onContextMenu,
    onRowPointerEnter,
    emptyText,
    exportFilename,
    onRefresh,
    sort,
    sortDir,
    onToggleSort,
    onPrev,
    onNext,
    onFirst,
    onLast,
    heightMode = "fill",
    className,
    enableColumnPicker = true,
    enableExport = true,
    enableClientSort = true,
  } = props;

  const [hiddenColumnIds, setHiddenColumnIds] = React.useState<string[]>([]);

  const hasSortableColumn = React.useMemo(
    () => columns.some((c) => c.sortable === true),
    [columns]
  );
  const useClientSort = enableClientSort && !onToggleSort && hasSortableColumn;
  const clientSort = useClientGridSort(rows, columns);
  const gridRows = useClientSort ? clientSort.rows : rows;
  const gridSort = useClientSort ? clientSort.sort : sort;
  const gridSortDir = useClientSort ? clientSort.sortDir : sortDir;
  const gridToggleSort = onToggleSort ?? (useClientSort ? clientSort.toggleSort : undefined);

  const toggleColumn = React.useCallback((columnId: string) => {
    setHiddenColumnIds((prev) =>
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]
    );
  }, []);

  const visibleColumns = React.useMemo(
    () => columns.filter((c) => !hiddenColumnIds.includes(c.id)),
    [columns, hiddenColumnIds]
  );

  const handleExport = React.useCallback(() => {
    if (!exportFilename) return;
    exportRowsToCsv(rows, visibleColumns, exportFilename);
  }, [exportFilename, rows, visibleColumns]);

  const footerActions =
    onRefresh || (enableExport && exportFilename) || enableColumnPicker ? (
      <DataGridFooterActions
        loading={loading}
        onRefresh={onRefresh}
        onExport={enableExport && exportFilename ? handleExport : undefined}
        exportDisabled={rows.length === 0}
        columns={enableColumnPicker ? columns : undefined}
        hiddenColumnIds={hiddenColumnIds}
        onToggleColumn={enableColumnPicker ? toggleColumn : undefined}
      />
    ) : null;

  return (
    <div
      className={[
        "hidden h-full min-h-0 w-full min-w-0 flex-1 flex-col lg:flex",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative h-full min-h-0 min-w-0 flex-1 overflow-hidden">
      <DataGrid
        rows={gridRows}
        columns={columns}
        loading={loading}
        error={error}
        emptyText={emptyText}
        getRowId={getRowId}
        selectedId={selectedId}
        selectionMode="single"
        onRowClick={(row, e) => onSelect(row, e)}
        onRowDoubleClick={onDoubleClick}
        onRowContextMenu={onContextMenu}
        onRowPointerEnter={onRowPointerEnter}
        sort={gridSort}
        sortDir={gridSortDir}
        onToggleSort={gridToggleSort}
        heightMode={heightMode}
        hiddenColumnIds={hiddenColumnIds}
        enableVirtualization={false}
      />
      </div>

      <PaginationFooter
        meta={meta}
        variant="desktop"
        onPrev={onPrev}
        onNext={onNext}
        onFirst={onFirst}
        onLast={onLast}
        leadingActions={footerActions}
      />
    </div>
  );
}
