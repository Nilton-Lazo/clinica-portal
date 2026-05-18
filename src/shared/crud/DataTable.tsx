import * as React from "react";
import {
  DataGrid,
  type DataGridColumnDef,
  exportRowsToCsv,
  useClientGridSort,
} from "../datagrid";
import type { PaginationMeta } from "../types/pagination";
import { DataGridFooterActions } from "../datagrid/DataGridFooterActions";
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
    const size = isCheck ? 44 : c.size ?? parsedSize ?? 180;

    const hideFromPicker = c.enableHiding === false || c.key === "actions" || c.key === "check";
    const isUtilityColumn = c.key === "actions" || c.key === "check";
    const defaultSortable =
      typeof c.header === "string" && c.header.trim() !== "" && !isUtilityColumn;

    return {
      id: c.key,
      header: c.header,
      columnLabel: c.columnLabel,
      sortable: c.sortable ?? defaultSortable,
      sortValue: c.sortValue,
      grow: c.grow,
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
  } = props;

  const [hiddenColumnIds, setHiddenColumnIds] = React.useState<string[]>([]);
  const gridColumns = React.useMemo(() => {
    const mapped = mapColumns(columns);
    if (!enableClientSort && !onToggleSort) {
      return mapped.map((col) => ({ ...col, sortable: false }));
    }
    return mapped;
  }, [columns, enableClientSort, onToggleSort]);

  const hasSortableColumn = React.useMemo(
    () => gridColumns.some((c) => c.sortable === true),
    [gridColumns]
  );
  const useClientSort = enableClientSort && !onToggleSort && hasSortableColumn;
  const clientSort = useClientGridSort(rows, gridColumns);
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
    () => gridColumns.filter((c) => !hiddenColumnIds.includes(c.id)),
    [gridColumns, hiddenColumnIds]
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
        columns={enableColumnPicker ? gridColumns : undefined}
        hiddenColumnIds={hiddenColumnIds}
        onToggleColumn={enableColumnPicker ? toggleColumn : undefined}
      />
    ) : null;

  const grid = (
    <DataGrid
      rows={gridRows}
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
      sort={gridSort}
      sortDir={gridSortDir}
      onToggleSort={gridToggleSort}
      heightMode={heightMode}
      tableClassName={tableClassName}
      hiddenColumnIds={hiddenColumnIds}
      enableVirtualization={false}
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