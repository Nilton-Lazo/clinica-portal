import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { DataGridColumnDef, DataGridSortState, SortDirection } from "./types";
import { DataGridSkeleton } from "./DataGridSkeleton";
import { GridCellText } from "./GridCellText";
import { renderGridHeader } from "./gridHeader";

const ROW_MIN_HEIGHT = 40;
const SELECTION_COL_WIDTH = 44;
const VIRTUAL_THRESHOLD = 40;

function alignClass(align?: "left" | "center" | "right") {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

function cellContentClass(align?: "left" | "center" | "right") {
  return [
    "flex min-h-10 w-full min-w-0 items-center",
    align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start",
  ].join(" ");
}

function toTanstackColumns<T>(columns: DataGridColumnDef<T>[]): ColumnDef<T, unknown>[] {
  return columns.map((col) => {
    const base: ColumnDef<T, unknown> = {
      id: col.id,
      header: () => renderGridHeader(col),
      size: col.size ?? 160,
      minSize: col.minSize ?? 80,
      maxSize: col.maxSize ?? 600,
      enableSorting: col.sortable === true,
      enableHiding: col.enableHiding !== false,
      cell: ({ row }) => {
        if (col.cell) return col.cell(row.original);
        if (col.accessor) {
          const value = row.original[col.accessor];
          const text = value == null || value === "" ? "—" : String(value);
          return (
            <GridCellText
              value={text}
              align={col.align}
              title={text !== "—" ? text : undefined}
            />
          );
        }
        return null;
      },
    };

    if (col.accessor) {
      return { ...base, accessorKey: col.accessor };
    }

    return base;
  });
}

export function DataGrid<T>(props: {
  rows: T[];
  columns: DataGridColumnDef<T>[];
  loading?: boolean;
  error?: string | null;
  emptyText?: string;
  getRowId: (row: T) => string | number;
  selectedId?: string | number | null;
  selectedIds?: Array<string | number>;
  selectionMode?: "single" | "multiple" | "none";
  onRowClick?: (row: T, event: React.MouseEvent) => void;
  onRowDoubleClick?: (row: T) => void;
  onRowContextMenu?: (row: T, event: React.MouseEvent) => void;
  onRowPointerEnter?: (row: T) => void;
  onSelectionChange?: (ids: Array<string | number>) => void;
  sort?: string | null;
  sortDir?: SortDirection;
  onSortChange?: (state: DataGridSortState) => void;
  onToggleSort?: (columnId: string) => void;
  heightMode?: "fill" | "hug";
  enableVirtualization?: boolean;
  tableClassName?: string;
  hiddenColumnIds?: string[];
}) {
  const {
    rows,
    columns: columnDefs,
    loading = false,
    error = null,
    emptyText = "No hay registros.",
    getRowId,
    selectedId = null,
    selectedIds,
    selectionMode = "single",
    onRowClick,
    onRowDoubleClick,
    onRowContextMenu,
    onRowPointerEnter,
    onSelectionChange,
    sort = null,
    sortDir = "asc",
    onSortChange,
    onToggleSort,
    heightMode = "fill",
    enableVirtualization = false,
    tableClassName,
    hiddenColumnIds = [],
  } = props;

  const parentRef = React.useRef<HTMLDivElement | null>(null);

  const visibleColumnDefs = React.useMemo(
    () => columnDefs.filter((c) => !hiddenColumnIds.includes(c.id)),
    [columnDefs, hiddenColumnIds]
  );

  const columnDefById = React.useMemo(() => {
    const map = new Map<string, DataGridColumnDef<T>>();
    for (const def of visibleColumnDefs) {
      map.set(def.id, def);
    }
    return map;
  }, [visibleColumnDefs]);

  const tanstackColumns = React.useMemo(() => toTanstackColumns(visibleColumnDefs), [visibleColumnDefs]);

  const table = useReactTable({
    data: rows,
    columns: tanstackColumns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: false,
    defaultColumn: { minSize: 80, size: 160 },
  });

  const tableRows = table.getRowModel().rows;
  const useVirtual = enableVirtualization && tableRows.length >= VIRTUAL_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_MIN_HEIGHT,
    overscan: 8,
    enabled: useVirtual,
  });

  const selectedSet = React.useMemo(() => {
    const ids = selectedIds ?? (selectedId != null ? [selectedId] : []);
    return new Set(ids.map(String));
  }, [selectedId, selectedIds]);

  const canSortColumns = Boolean(onToggleSort || onSortChange);

  const handlersRef = React.useRef({
    onRowClick,
    onRowDoubleClick,
    onRowContextMenu,
    onRowPointerEnter,
    onSelectionChange,
    getRowId,
    selectionMode,
  });
  handlersRef.current = {
    onRowClick,
    onRowDoubleClick,
    onRowContextMenu,
    onRowPointerEnter,
    onSelectionChange,
    getRowId,
    selectionMode,
  };

  const toggleRowSelection = React.useCallback((row: T) => {
    const { selectionMode: mode, onSelectionChange: onChange, getRowId: getId } = handlersRef.current;
    if (mode === "none" || !onChange) return;
    const id = getId(row);
    if (mode === "single") {
      onChange([id]);
      return;
    }
    const next = new Set(selectedSet);
    const key = String(id);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange([...next].map((x) => (Number.isFinite(Number(x)) ? Number(x) : x)));
  }, [selectedSet]);

  const handleHeaderSort = React.useCallback(
    (columnId: string, sortable: boolean) => {
      if (!sortable || !canSortColumns) return;
      if (onToggleSort) {
        onToggleSort(columnId);
        return;
      }
      if (!onSortChange) return;
      if (sort === columnId) {
        onSortChange({ sort: columnId, sortDir: sortDir === "asc" ? "desc" : "asc" });
        return;
      }
      onSortChange({ sort: columnId, sortDir: "asc" });
    },
    [canSortColumns, onToggleSort, onSortChange, sort, sortDir]
  );

  const columnLayout = React.useMemo(() => {
    let fixedSum = selectionMode === "multiple" ? SELECTION_COL_WIDTH : 0;
    let flexGrowColumnId: string | null = null;

    for (let i = visibleColumnDefs.length - 1; i >= 0; i -= 1) {
      if (visibleColumnDefs[i]?.grow) {
        flexGrowColumnId = visibleColumnDefs[i]!.id;
        break;
      }
    }

    for (const def of visibleColumnDefs) {
      if (def.grow && def.id !== flexGrowColumnId) {
        fixedSum += def.minSize ?? 140;
      } else if (!def.grow) {
        fixedSum += def.size ?? 160;
      }
    }

    const flexGrowDef = flexGrowColumnId ? columnDefById.get(flexGrowColumnId) : null;
    const minTableWidth = fixedSum + (flexGrowDef ? flexGrowDef.minSize ?? 140 : 0);

    return { flexGrowColumnId, minTableWidth };
  }, [visibleColumnDefs, selectionMode, columnDefById]);

  const colWidthFor = React.useCallback(
    (def: DataGridColumnDef<T>) => {
      if (!def.grow) return def.size ?? 160;
      if (def.id === columnLayout.flexGrowColumnId) return undefined;
      return def.minSize ?? 140;
    },
    [columnLayout.flexGrowColumnId]
  );

  const rootClass =
    heightMode === "hug"
      ? "relative flex w-full flex-none flex-col overflow-hidden rounded-md border border-(--border-color-default) bg-(--color-surface)"
      : "relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-(--border-color-default) bg-(--color-surface)";

  const isFillHeight = heightMode === "fill";

  const scrollClass = isFillHeight
    ? "datagrid-scroll absolute inset-0 overflow-x-auto overflow-y-auto"
    : "datagrid-scroll w-full max-h-[min(70vh,640px)] overflow-x-auto overflow-y-auto";

  const virtualHeight = useVirtual ? virtualizer.getTotalSize() : undefined;
  const showSkeleton = loading && rows.length === 0;
  const showEmpty = !loading && !error && rows.length === 0;
  const showError = Boolean(error) && rows.length === 0;

  const colSpanFull = visibleColumnDefs.length + (selectionMode === "multiple" ? 1 : 0);

  const tableContent = (
    <table
      className={["w-full border-collapse text-sm table-fixed", tableClassName ?? ""]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: "100%",
        minWidth: columnLayout.minTableWidth,
      }}
    >
      <colgroup>
        {selectionMode === "multiple" ? <col style={{ width: SELECTION_COL_WIDTH }} /> : null}
        {visibleColumnDefs.map((def) => {
          const width = colWidthFor(def);
          return <col key={def.id} style={width ? { width } : undefined} />;
        })}
      </colgroup>

      <thead className="sticky top-0 z-10 bg-(--color-primary) text-(--color-text-inverse)">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {selectionMode === "multiple" ? (
              <th
                className="px-0 py-2 align-middle"
                style={{
                  width: SELECTION_COL_WIDTH,
                  minWidth: SELECTION_COL_WIDTH,
                  maxWidth: SELECTION_COL_WIDTH,
                }}
                aria-label="Selección"
              />
            ) : null}
            {headerGroup.headers.map((header) => {
              const def = columnDefById.get(header.column.id);
              const sortable = def?.sortable === true;
              const sortInteractive = sortable && canSortColumns;
              const active = sort === header.column.id;
              const colWidth = def ? colWidthFor(def) : header.getSize();
              return (
                <th
                  key={header.id}
                  className={[
                    "relative px-3 py-0 font-semibold select-none align-middle",
                    alignClass(def?.align),
                    sortInteractive ? "cursor-pointer hover:bg-(--color-primary)/90" : "",
                    def?.id === columnLayout.flexGrowColumnId ? "w-auto min-w-0" : "",
                    def?.headerClassName ?? "",
                  ].join(" ")}
                  style={colWidth ? { width: colWidth } : undefined}
                  onClick={() => handleHeaderSort(header.column.id, sortInteractive)}
                >
                  <div className="flex min-h-11 w-full items-center justify-center">
                    <span
                      className={[
                        "inline-flex min-w-0 items-center gap-1",
                        def?.id === "check" || def?.align === "center"
                          ? "w-full justify-center"
                          : def?.align === "right"
                            ? "ml-auto justify-end"
                            : "mr-auto justify-start",
                      ].join(" ")}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sortable && canSortColumns ? (
                        active ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5 opacity-90" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 opacity-90" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                        )
                      ) : null}
                    </span>
                  </div>
                </th>
              );
            })}
          </tr>
        ))}
      </thead>

      <tbody>
        {showSkeleton ? (
          <tr>
            <td colSpan={colSpanFull}>
              <DataGridSkeleton columns={visibleColumnDefs.length} />
            </td>
          </tr>
        ) : showError ? (
          <tr>
            <td colSpan={colSpanFull} className="px-3 py-8 text-center text-sm text-red-600">
              {error}
            </td>
          </tr>
        ) : showEmpty ? (
          <tr>
            <td colSpan={colSpanFull} className="px-3 py-8 text-center text-sm text-(--color-text-secondary)">
              {emptyText}
            </td>
          </tr>
        ) : useVirtual ? (
          <>
            {virtualizer.getVirtualItems().length > 0 ? (
              <tr style={{ height: virtualizer.getVirtualItems()[0]?.start ?? 0 }}>
                <td colSpan={colSpanFull} />
              </tr>
            ) : null}
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = tableRows[virtualRow.index];
              if (!row) return null;
              const id = getRowId(row.original);
              const active = selectedSet.has(String(id));
              return (
                <DataRow
                  key={String(id)}
                  rowId={id}
                  row={row}
                  active={active}
                  zebra={virtualRow.index % 2 === 1}
                  visibleColumnDefs={visibleColumnDefs}
                  flexGrowColumnId={columnLayout.flexGrowColumnId}
                  colWidthFor={colWidthFor}
                  handlersRef={handlersRef}
                  toggleRowSelection={toggleRowSelection}
                />
              );
            })}
            {virtualizer.getVirtualItems().length > 0 ? (
              <tr
                style={{
                  height: virtualHeight! - (virtualizer.getVirtualItems().at(-1)?.end ?? 0),
                }}
              >
                <td colSpan={colSpanFull} />
              </tr>
            ) : null}
          </>
        ) : (
          tableRows.map((row, index) => {
            const id = getRowId(row.original);
            const active = selectedSet.has(String(id));
            return (
              <DataRow
                key={String(id)}
                rowId={id}
                row={row}
                active={active}
                zebra={index % 2 === 1}
                visibleColumnDefs={visibleColumnDefs}
                flexGrowColumnId={columnLayout.flexGrowColumnId}
                colWidthFor={colWidthFor}
                handlersRef={handlersRef}
                toggleRowSelection={toggleRowSelection}
              />
            );
          })
        )}
      </tbody>
    </table>
  );

  const scrollContainer = (
    <div ref={parentRef} className={scrollClass}>
      {tableContent}
    </div>
  );

  return (
    <div className={rootClass}>
      {isFillHeight ? (
        <div className="relative min-h-0 flex-1 overflow-hidden">{scrollContainer}</div>
      ) : (
        scrollContainer
      )}

      {loading && rows.length > 0 ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden bg-(--color-primary)/20">
          <div className="h-full w-1/3 animate-[datagrid-indeterminate_1.2s_ease-in-out_infinite] bg-(--color-primary)" />
        </div>
      ) : null}
    </div>
  );
}

type DataRowHandlersRef<T> = React.MutableRefObject<{
  onRowClick?: (row: T, event: React.MouseEvent) => void;
  onRowDoubleClick?: (row: T) => void;
  onRowContextMenu?: (row: T, event: React.MouseEvent) => void;
  onRowPointerEnter?: (row: T) => void;
  onSelectionChange?: (ids: Array<string | number>) => void;
  getRowId: (row: T) => string | number;
  selectionMode: "single" | "multiple" | "none";
}>;

type DataRowProps<T> = {
  rowId: string | number;
  row: Row<T>;
  active: boolean;
  zebra: boolean;
  visibleColumnDefs: DataGridColumnDef<T>[];
  flexGrowColumnId: string | null;
  colWidthFor: (def: DataGridColumnDef<T>) => number | undefined;
  handlersRef: DataRowHandlersRef<T>;
  toggleRowSelection: (row: T) => void;
};

function DataRowImpl<T>(props: DataRowProps<T>) {
  const {
    row,
    active,
    zebra,
    visibleColumnDefs,
    flexGrowColumnId,
    colWidthFor,
    handlersRef,
    toggleRowSelection,
  } = props;

  const original = row.original;

  const columnDefById = React.useMemo(() => {
    const map = new Map<string, DataGridColumnDef<T>>();
    for (const def of visibleColumnDefs) map.set(def.id, def);
    return map;
  }, [visibleColumnDefs]);

  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      const h = handlersRef.current;
      h.onRowClick?.(original, e);
      if (h.selectionMode !== "none") toggleRowSelection(original);
    },
    [handlersRef, original, toggleRowSelection]
  );

  const handleDoubleClick = React.useCallback(() => {
    handlersRef.current.onRowDoubleClick?.(original);
  }, [handlersRef, original]);

  const handlePointerEnter = React.useCallback(() => {
    handlersRef.current.onRowPointerEnter?.(original);
  }, [handlersRef, original]);

  const handleContextMenu = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handlersRef.current.onRowContextMenu?.(original, e);
    },
    [handlersRef, original]
  );

  const selectionMode = handlersRef.current.selectionMode;

  return (
    <tr
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onPointerEnter={handlePointerEnter}
      onContextMenu={handleContextMenu}
      className={[
        "min-h-10 cursor-pointer border-t border-(--border-color-default) transition-colors",
        active ? "bg-(--color-surface-hover)" : zebra ? "bg-(--color-panel-bg)/40" : "bg-(--color-surface)",
        "hover:bg-(--color-surface-hover)",
      ].join(" ")}
    >
      {selectionMode === "multiple" ? (
        <td
          className="px-0 py-2 align-middle"
          style={{
            width: SELECTION_COL_WIDTH,
            minWidth: SELECTION_COL_WIDTH,
            maxWidth: SELECTION_COL_WIDTH,
          }}
        >
          <div className="flex min-h-10 items-center justify-center">
            <input
              type="checkbox"
              checked={active}
              onChange={() => toggleRowSelection(original)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 shrink-0 rounded border border-(--border-color-default)"
              aria-label="Seleccionar fila"
            />
          </div>
        </td>
      ) : null}
      {row.getVisibleCells().map((cell) => {
        const def = columnDefById.get(cell.column.id);
        const colWidth = def ? colWidthFor(def) : cell.column.getSize();
        const isFlexGrow = def?.id === flexGrowColumnId;
        return (
          <td
            key={cell.id}
            className={[
              "px-3 py-2 align-middle",
              isFlexGrow ? "min-w-0" : "",
              alignClass(def?.align),
              def?.cellClassName ?? "",
            ].join(" ")}
            style={colWidth ? { width: colWidth } : undefined}
          >
            <div className={cellContentClass(def?.align)}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          </td>
        );
      })}
    </tr>
  );
}

const DataRow = React.memo(DataRowImpl) as typeof DataRowImpl;
