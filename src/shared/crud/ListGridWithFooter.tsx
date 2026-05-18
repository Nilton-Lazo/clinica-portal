import * as React from "react";
import type { PaginationMeta } from "../types/pagination";
import {
  DataGrid,
  type DataGridColumnDef,
  type SortDirection,
  exportRowsToCsv,
  useClientGridSort,
} from "../datagrid";
import type { GridSortDefaults } from "../datagrid/gridSortCycle";
import { DataGridFooterActions } from "../datagrid/DataGridFooterActions";
import { PaginationFooter } from "./PaginationFooter";

function buildListMeta(rows: number, meta?: PaginationMeta): PaginationMeta {
  if (meta) return meta;
  const total = Math.max(0, rows);
  return {
    current_page: 1,
    per_page: Math.max(total, 1),
    total,
    last_page: 1,
  };
}

export function ListGridWithFooter<T>(props: {
  rows: T[];
  columns: DataGridColumnDef<T>[];
  loading?: boolean;
  error?: string | null;
  emptyText?: string;
  getRowId: (row: T) => string | number;
  selectedId?: string | number | null;
  onRowClick?: (row: T, event: React.MouseEvent) => void;
  onRowDoubleClick?: (row: T) => void;
  onRowContextMenu?: (row: T, event: React.MouseEvent) => void;
  heightMode?: "fill" | "hug";
  className?: string;
  meta?: PaginationMeta;
  paginationVariant?: "desktop" | "mobile";
  onPrev?: () => void;
  onNext?: () => void;
  onFirst?: () => void;
  onLast?: () => void;
  exportFilename?: string;
  onRefresh?: () => void;
  enableColumnPicker?: boolean;
  enableExport?: boolean;
  sort?: string | null;
  sortDir?: SortDirection;
  onToggleSort?: (columnId: string) => void;
  enableClientSort?: boolean;
  defaultSort?: GridSortDefaults;
}) {
  const {
    rows,
    columns,
    loading = false,
    error,
    emptyText,
    getRowId,
    selectedId,
    onRowClick,
    onRowDoubleClick,
    onRowContextMenu,
    heightMode = "hug",
    className,
    meta,
    paginationVariant = "desktop",
    onPrev,
    onNext,
    onFirst,
    onLast,
    exportFilename,
    onRefresh,
    enableColumnPicker = true,
    enableExport = true,
    sort,
    sortDir,
    onToggleSort,
    enableClientSort = true,
    defaultSort,
  } = props;

  const [hiddenColumnIds, setHiddenColumnIds] = React.useState<string[]>([]);

  const hasSortableColumn = React.useMemo(
    () => columns.some((c) => c.sortable === true),
    [columns]
  );
  const useClientSort = enableClientSort && !onToggleSort && hasSortableColumn;
  const clientSort = useClientGridSort(rows, columns, defaultSort ? { defaultSort } : undefined);
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

  const hasPagination = Boolean(meta && onPrev && onNext);
  const listMeta = buildListMeta(rows.length, meta);
  const showFooter = Boolean(footerActions || hasPagination);

  const grid = (
    <DataGrid
      rows={gridRows}
      columns={columns}
      loading={loading}
      error={error}
      emptyText={emptyText}
      getRowId={getRowId}
      selectedId={selectedId}
      selectionMode="single"
      onRowClick={onRowClick}
      onRowDoubleClick={onRowDoubleClick}
      onRowContextMenu={onRowContextMenu}
      sort={gridSort}
      sortDir={gridSortDir}
      onToggleSort={gridToggleSort}
      heightMode={heightMode}
      hiddenColumnIds={hiddenColumnIds}
      enableVirtualization={false}
    />
  );

  const shellClass = ["flex w-full min-w-0 flex-col", className ?? ""].filter(Boolean).join(" ");

  if (!showFooter) {
    return (
      <div className={shellClass}>
        <div className="min-h-0 min-w-0 overflow-hidden">{grid}</div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div className="min-h-0 min-w-0 overflow-hidden">{grid}</div>
      <PaginationFooter
        meta={listMeta}
        variant={paginationVariant}
        hidePagination={!hasPagination}
        onPrev={onPrev ?? (() => {})}
        onNext={onNext ?? (() => {})}
        onFirst={onFirst}
        onLast={onLast}
        leadingActions={footerActions}
      />
    </div>
  );
}
