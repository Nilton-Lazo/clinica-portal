import type { MouseEvent } from "react";
import type { PaginationMeta } from "../types/pagination";
import {
  DataGrid,
  type DataGridColumnDef,
  type SortDirection,
} from "../datagrid";
import { DataGridFooterActions } from "../datagrid/DataGridFooterActions";
import { useTableShellState } from "../datatable/useTableShellState";
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
  tableId?: string;
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
    tableId,
  } = props;

  const shell = useTableShellState({
    rows,
    columns,
    enableClientSort,
    onToggleSort,
    sort,
    sortDir,
    exportFilename,
    tableId,
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
          rows={shell.effectiveRows}
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
          sort={shell.effectiveSort}
          sortDir={shell.effectiveSortDir}
          onToggleSort={shell.effectiveToggleSort}
          heightMode={heightMode}
          hiddenColumnIds={shell.hiddenColumnIds}
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
