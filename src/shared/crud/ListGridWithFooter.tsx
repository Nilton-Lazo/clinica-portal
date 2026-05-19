import * as React from "react";
import type { PaginationMeta } from "../types/pagination";
import {
  DataGrid,
  type DataGridColumnDef,
  type SortDirection,
} from "../datagrid";
import type { GridSortDefaults } from "../datagrid/gridSortCycle";
import { DataGridFooterActions } from "../datagrid/DataGridFooterActions";
import { useTableShellState } from "../datatable/useTableShellState";
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
  tableId?: string;
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
    tableId,
  } = props;

  const shell = useTableShellState({
    rows,
    columns,
    enableClientSort,
    onToggleSort,
    sort,
    sortDir,
    defaultSort,
    exportFilename,
  });

  const footerActions =
    onRefresh || (enableExport && exportFilename) || enableColumnPicker ? (
      <DataGridFooterActions
        loading={loading}
        onRefresh={onRefresh}
        onExport={enableExport && exportFilename ? shell.handleExport : undefined}
        exportDisabled={rows.length === 0}
        columns={enableColumnPicker ? columns : undefined}
        hiddenColumnIds={shell.hiddenColumnIds}
        onToggleColumn={enableColumnPicker ? shell.toggleColumn : undefined}
      />
    ) : null;

  const hasPagination = Boolean(meta && onPrev && onNext);
  const listMeta = buildListMeta(rows.length, meta);
  const showFooter = Boolean(footerActions || hasPagination);

  const grid = (
    <DataGrid
      rows={shell.effectiveRows}
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
      sort={shell.effectiveSort}
      sortDir={shell.effectiveSortDir}
      onToggleSort={shell.effectiveToggleSort}
      heightMode={heightMode}
      hiddenColumnIds={shell.hiddenColumnIds}
      tableId={tableId}
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
