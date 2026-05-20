import * as React from "react";
import {
  DataGrid,
  type DataGridColumnDef,
} from "../datagrid";
import type { PaginationMeta } from "../types/pagination";
import { DataGridFooterActions } from "../datagrid/DataGridFooterActions";
import { useTableShellState } from "../datatable/useTableShellState";
import { isUtilityColumn } from "../datatable/columnKinds";
import { PaginationFooter } from "./PaginationFooter";
import { parseTailwindWidth } from "./parseTailwindWidth";

export type DataTableColumn<T> = {
  key: string;
  header: React.ReactNode;
  columnLabel?: string;
  headerClassName?: string;
  cellClassName?: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number | null | undefined;
  grow?: boolean;
  size?: number;
  enableHiding?: boolean;
  render: (row: T) => React.ReactNode;
};

function mapColumns<T>(columns: DataTableColumn<T>[]): DataGridColumnDef<T>[] {
  return columns.map((c) => {
    const parsedSize = parseTailwindWidth(c.headerClassName);
    const isCheck = c.key === "check";
    const hasExplicitWidth = c.size != null || parsedSize != null;
    const wantsGrow =
      c.grow ??
      (!hasExplicitWidth && c.headerClassName?.includes("min-w-0") ? true : undefined);
    const size = isCheck ? 44 : c.size ?? parsedSize ?? 180;

    const isUtility = isUtilityColumn(c.key);
    const hideFromPicker = c.enableHiding === false || isUtility;
    const defaultSortable =
      typeof c.header === "string" && c.header.trim() !== "" && !isUtility;

    return {
      id: c.key,
      header: c.header,
      columnLabel: c.columnLabel,
      sortable: c.sortable ?? defaultSortable,
      sortValue: c.sortValue,
      grow: wantsGrow,
      enableHiding: hideFromPicker ? false : c.enableHiding,
      align: isCheck
        ? "center"
        : c.headerClassName?.includes("text-center")
          ? "center"
          : c.headerClassName?.includes("text-right")
            ? "right"
            : "left",
      size,
      minSize: isCheck ? 44 : undefined,
      maxSize: isCheck ? 44 : undefined,
      headerClassName: c.headerClassName,
      cellClassName: c.cellClassName,
      cell: (row) => c.render(row),
    };
  });
}

export function DataTable<T>(props: {
  rows: T[];
  columns: DataTableColumn<T>[];
  loading: boolean;
  selectedId: string | number | null;
  getRowId: (row: T) => string | number;
  onSelect: (row: T, e?: React.MouseEvent) => void;
  onDoubleClick?: (row: T) => void;
  onContextMenu?: (row: T, e: React.MouseEvent) => void;
  onRowPointerEnter?: (row: T) => void;
  emptyText?: string;
  tableClassName?: string;
  emptyRowClassName?: string;
  heightMode?: "fill" | "hug";
  sort?: string | null;
  sortDir?: "asc" | "desc";
  onToggleSort?: (columnId: string) => void;
  error?: string | null;
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
  enableClientSort?: boolean;
  shellClassName?: string;
  tableId?: string;
}) {
  const {
    rows,
    columns,
    loading,
    selectedId,
    getRowId,
    onSelect,
    onDoubleClick,
    onContextMenu,
    onRowPointerEnter,
    emptyText,
    tableClassName,
    heightMode = "fill",
    sort,
    sortDir,
    onToggleSort,
    error,
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
    enableClientSort = true,
    shellClassName,
    tableId,
  } = props;

  const gridColumns = React.useMemo(() => {
    const mapped = mapColumns(columns);
    if (!enableClientSort && !onToggleSort) {
      return mapped.map((col) => ({ ...col, sortable: false }));
    }
    return mapped;
  }, [columns, enableClientSort, onToggleSort]);

  const shell = useTableShellState({
    rows,
    columns: gridColumns,
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
        columns={enableColumnPicker ? gridColumns : undefined}
        hiddenColumnIds={shell.hiddenColumnIds}
        onToggleColumn={enableColumnPicker ? shell.toggleColumn : undefined}
      />
    ) : null;

  const grid = (
    <DataGrid
      rows={shell.effectiveRows}
      columns={gridColumns}
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
      tableClassName={tableClassName}
      hiddenColumnIds={shell.hiddenColumnIds}
    />
  );

  const hasPagination = Boolean(meta && onPrev && onNext);
  const listMeta: PaginationMeta = meta ?? {
    current_page: 1,
    per_page: Math.max(rows.length, 1),
    total: rows.length,
    last_page: 1,
  };
  const showFooter = Boolean(footerActions || hasPagination);

  if (!showFooter) {
    return grid;
  }

  return (
    <div className={["flex w-full min-w-0 flex-col", shellClassName ?? ""].filter(Boolean).join(" ")}>
      <div className="relative h-full min-h-0 min-w-0 flex-1 overflow-hidden">{grid}</div>
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
