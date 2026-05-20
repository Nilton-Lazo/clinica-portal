import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnSizingState,
  type Row,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { DataGridColumnDef, DataGridSortState, SortDirection } from "./types";
import { nextGridSort } from "./gridSortCycle";
import { DataGridSkeleton } from "./DataGridSkeleton";
import { GridCellText } from "./GridCellText";
import { GridHeaderRenderer } from "./gridHeader";
import {
  DENSITY_CELL_PADDING_X,
  DENSITY_CELL_PADDING_Y,
  DENSITY_HEADER_HEIGHT,
  DENSITY_ROW_HEIGHT,
  TABLE_DEFAULT_COL_SIZE,
  TABLE_DEFAULT_MAX_SIZE,
  TABLE_DEFAULT_MIN_SIZE,
  TABLE_GROW_MIN_SIZE,
  TABLE_SELECTION_COL_WIDTH,
  TABLE_VIRTUAL_THRESHOLD,
  type TableDensity,
} from "../datatable/tokens";

function alignClass(align?: "left" | "center" | "right") {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

function justifyForAlign(align?: "left" | "center" | "right") {
  if (align === "center") return "justify-center";
  if (align === "right") return "justify-end";
  return "justify-start";
}

function cellContentClass(align?: "left" | "center" | "right") {
  return ["flex w-full min-w-0 items-center", justifyForAlign(align)].join(" ");
}

function toTanstackColumns<T>(columns: DataGridColumnDef<T>[]): ColumnDef<T, unknown>[] {
  return columns.map((col) => {
    const base: ColumnDef<T, unknown> = {
      id: col.id,
      header: () => <GridHeaderRenderer col={col} />,
      size: col.size ?? TABLE_DEFAULT_COL_SIZE,
      minSize: col.minSize ?? TABLE_DEFAULT_MIN_SIZE,
      maxSize: col.maxSize ?? TABLE_DEFAULT_MAX_SIZE,
      enableSorting: col.sortable === true,
      enableHiding: col.enableHiding !== false,
      enableResizing: col.resizable !== false,
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

type ColumnSizing = {
  width: number | undefined;
  minWidth: number;
  maxWidth: number | undefined;
  isGrow: boolean;
};

const TABLE_HEADER_RESIZE_RESERVE_PX = 12;

function resolveColumnSizing<T>(def: DataGridColumnDef<T>): ColumnSizing {
  if (def.grow) {
    return {
      width: undefined,
      minWidth: def.minSize ?? TABLE_GROW_MIN_SIZE,
      maxWidth: def.maxSize,
      isGrow: true,
    };
  }
  const base = def.size ?? def.minSize ?? TABLE_DEFAULT_COL_SIZE;
  return {
    width: base,
    minWidth: def.minSize ?? base,
    maxWidth: def.maxSize ?? base,
    isGrow: false,
  };
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
  virtualThreshold?: number;
  density?: TableDensity;
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
    enableVirtualization,
    virtualThreshold = TABLE_VIRTUAL_THRESHOLD,
    density = "default",
    tableClassName,
    hiddenColumnIds = [],
  } = props;

  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});

  const rowHeight = DENSITY_ROW_HEIGHT[density];
  const headerMinHeight = DENSITY_HEADER_HEIGHT[density];
  const paddingY = DENSITY_CELL_PADDING_Y[density];
  const paddingX = DENSITY_CELL_PADDING_X[density];

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

  const sizingByColumnId = React.useMemo(() => {
    const map = new Map<string, ColumnSizing>();
    for (const def of visibleColumnDefs) {
      const base = resolveColumnSizing(def);
      const override = columnSizing[def.id];
      if (override != null && Number.isFinite(override) && override > 0) {
        if (base.isGrow) {
          map.set(def.id, {
            width: override,
            minWidth: Math.min(base.minWidth, override),
            maxWidth: override,
            isGrow: false,
          });
        } else {
          const maxW = base.maxWidth != null ? Math.max(base.maxWidth, override) : override;
          map.set(def.id, { ...base, width: override, maxWidth: maxW });
        }
      } else {
        map.set(def.id, base);
      }
    }
    return map;
  }, [visibleColumnDefs, columnSizing]);

  const minTableWidth = React.useMemo(() => {
    let total = selectionMode === "multiple" ? TABLE_SELECTION_COL_WIDTH : 0;
    for (const def of visibleColumnDefs) {
      const sz = sizingByColumnId.get(def.id);
      if (sz) total += sz.minWidth;
    }
    return total;
  }, [visibleColumnDefs, sizingByColumnId, selectionMode]);

  const tanstackColumns = React.useMemo(() => toTanstackColumns(visibleColumnDefs), [visibleColumnDefs]);

  const table = useReactTable({
    data: rows,
    columns: tanstackColumns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    state: { columnSizing },
    onColumnSizingChange: setColumnSizing,
    defaultColumn: { minSize: TABLE_DEFAULT_MIN_SIZE, size: TABLE_DEFAULT_COL_SIZE },
  });

  const tableRows = table.getRowModel().rows;
  const autoVirtualize = enableVirtualization ?? tableRows.length >= virtualThreshold;
  const useVirtual = autoVirtualize && tableRows.length >= virtualThreshold;

  const isResizingAnyColumn = !!table.getState().columnSizingInfo.isResizingColumn;

  React.useEffect(() => {
    if (!isResizingAnyColumn || typeof document === "undefined") return;
    const body = document.body;
    const prevCursor = body.style.cursor;
    const prevUserSelect = body.style.userSelect;
    body.style.cursor = "col-resize";
    body.style.userSelect = "none";
    return () => {
      body.style.cursor = prevCursor;
      body.style.userSelect = prevUserSelect;
    };
  }, [isResizingAnyColumn]);

  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
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
  });
  handlersRef.current = {
    onRowClick,
    onRowDoubleClick,
    onRowContextMenu,
    onRowPointerEnter,
    onSelectionChange,
    getRowId,
  };

  const toggleRowSelection = React.useCallback((row: T) => {
    const { onSelectionChange: onChange, getRowId: getId } = handlersRef.current;
    if (selectionMode === "none" || !onChange) return;
    const id = getId(row);
    if (selectionMode === "single") {
      onChange([id]);
      return;
    }
    const next = new Set(selectedSet);
    const key = String(id);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange([...next].map((x) => (Number.isFinite(Number(x)) ? Number(x) : x)));
  }, [selectionMode, selectedSet]);

  const handleHeaderSort = React.useCallback(
    (columnId: string, sortable: boolean) => {
      if (!sortable || !canSortColumns) return;
      if (onToggleSort) {
        onToggleSort(columnId);
        return;
      }
      if (!onSortChange) return;
      const next = nextGridSort(
        { sort: sort ?? null, sortDir: sortDir ?? "asc" },
        columnId,
        { column: columnId, direction: "asc" }
      );
      onSortChange(next);
    },
    [canSortColumns, onToggleSort, onSortChange, sort, sortDir]
  );

  const rootClass =
    heightMode === "hug"
      ? "relative flex w-full flex-none flex-col overflow-hidden rounded-md border border-(--border-color-default) bg-(--color-surface)"
      : "relative flex h-full min-h-[280px] min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-(--border-color-default) bg-(--color-surface)";

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
      style={{ minWidth: minTableWidth }}
    >
      <colgroup>
        {selectionMode === "multiple" ? <col style={{ width: TABLE_SELECTION_COL_WIDTH }} /> : null}
        {visibleColumnDefs.map((def) => {
          const sz = sizingByColumnId.get(def.id);
          return <col key={def.id} style={sz?.width ? { width: sz.width } : undefined} />;
        })}
      </colgroup>

      <thead className="sticky top-0 z-10 bg-(--color-primary) text-(--color-text-inverse) shadow-[0_1px_0_0] shadow-(--color-primary)">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {selectionMode === "multiple" ? (
              <th
                className="bg-(--color-primary) p-0 text-center align-middle"
                style={{
                  width: TABLE_SELECTION_COL_WIDTH,
                  minWidth: TABLE_SELECTION_COL_WIDTH,
                  maxWidth: TABLE_SELECTION_COL_WIDTH,
                  minHeight: headerMinHeight,
                }}
                aria-label="Selección"
              />
            ) : null}
            {headerGroup.headers.map((header) => {
              const def = columnDefById.get(header.column.id);
              const sortable = def?.sortable === true;
              const sortInteractive = sortable && canSortColumns;
              const active = sort === header.column.id;
              const sizing = sizingByColumnId.get(header.column.id);
              const isGrow = sizing?.isGrow ?? false;
              const canResize = header.column.getCanResize();
              const isResizing = header.column.getIsResizing();
              return (
                <th
                  key={header.id}
                  className={[
                    "group/th relative border-b border-(--border-color-default) bg-(--color-primary) text-center font-semibold select-none align-middle",
                    paddingX,
                    paddingY,
                    canResize ? "pr-3" : "",
                    sortInteractive
                      ? "cursor-pointer outline-none transition-[filter] hover:brightness-110 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-(--color-text-inverse)"
                      : "",
                  ].join(" ")}
                  style={{
                    width: isGrow ? undefined : sizing?.width,
                    minWidth: sizing?.minWidth,
                    maxWidth: sizing?.maxWidth,
                    minHeight: headerMinHeight,
                  }}
                  tabIndex={sortInteractive ? 0 : -1}
                  onClick={() => handleHeaderSort(header.column.id, sortInteractive)}
                  onKeyDown={(e) => {
                    if (!sortInteractive) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleHeaderSort(header.column.id, sortInteractive);
                    }
                  }}
                  aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                >
                  <div
                    className="flex w-full min-w-0 items-center justify-center"
                    style={{ paddingRight: canResize ? TABLE_HEADER_RESIZE_RESERVE_PX : 0 }}
                  >
                    <span className="min-w-0 text-center leading-tight wrap-break-words whitespace-normal">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </span>
                  </div>
                  {canResize ? (
                    <span
                      role="separator"
                      aria-orientation="vertical"
                      aria-label="Redimensionar columna"
                      title="Arrastrar para cambiar el ancho. Doble clic para restablecer."
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        header.getResizeHandler()(e);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        header.getResizeHandler()(e);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        header.column.resetSize();
                      }}
                      className="group/resize absolute top-0 right-0 z-10 flex h-full w-2.5 cursor-col-resize touch-none select-none items-center justify-end"
                    >
                      <span
                        aria-hidden="true"
                        className={[
                          "block rounded-full transition-all duration-150",
                          isResizing
                            ? "h-3/5 w-[3px] bg-(--color-text-inverse)"
                            : "h-1/2 w-px bg-(--color-text-inverse)/40 group-hover/resize:h-3/5 group-hover/resize:w-[3px] group-hover/resize:bg-(--color-text-inverse)",
                        ].join(" ")}
                      />
                    </span>
                  ) : null}
                </th>
              );
            })}
          </tr>
        ))}
      </thead>

      <tbody className="[&>tr:first-child]:border-t-0">
        {showSkeleton ? (
          <tr>
            <td colSpan={colSpanFull}>
              <DataGridSkeleton columns={visibleColumnDefs.length} />
            </td>
          </tr>
        ) : showError ? (
          <tr>
            <td colSpan={colSpanFull} className={`${paddingX} py-8 text-center text-sm text-(--color-danger)`}>
              {error}
            </td>
          </tr>
        ) : showEmpty ? (
          <tr>
            <td colSpan={colSpanFull} className={`${paddingX} py-8 text-center text-sm text-(--color-text-secondary)`}>
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
                  rowHeight={rowHeight}
                  paddingY={paddingY}
                  paddingX={paddingX}
                  selectionMode={selectionMode}
                  visibleColumnDefs={visibleColumnDefs}
                  sizingByColumnId={sizingByColumnId}
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
                rowHeight={rowHeight}
                paddingY={paddingY}
                paddingX={paddingX}
                selectionMode={selectionMode}
                visibleColumnDefs={visibleColumnDefs}
                sizingByColumnId={sizingByColumnId}
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
}>;

type DataRowProps<T> = {
  rowId: string | number;
  row: Row<T>;
  active: boolean;
  zebra: boolean;
  rowHeight: number;
  paddingY: string;
  paddingX: string;
  selectionMode: "single" | "multiple" | "none";
  visibleColumnDefs: DataGridColumnDef<T>[];
  sizingByColumnId: Map<string, ColumnSizing>;
  handlersRef: DataRowHandlersRef<T>;
  toggleRowSelection: (row: T) => void;
};

function DataRowImpl<T>(props: DataRowProps<T>) {
  const {
    row,
    active,
    zebra,
    rowHeight,
    paddingY,
    paddingX,
    selectionMode,
    visibleColumnDefs,
    sizingByColumnId,
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
      if (selectionMode !== "none") toggleRowSelection(original);
    },
    [handlersRef, original, selectionMode, toggleRowSelection]
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

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (selectionMode !== "none") toggleRowSelection(original);
        handlersRef.current.onRowClick?.(original, e as unknown as React.MouseEvent);
      }
    },
    [handlersRef, original, selectionMode, toggleRowSelection]
  );

  return (
    <tr
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onPointerEnter={handlePointerEnter}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="row"
      aria-selected={active}
      className={[
        "cursor-pointer border-t border-(--border-color-default) outline-none transition-colors",
        active
          ? "bg-(--color-surface-hover)"
          : zebra
            ? "bg-(--color-panel-bg)/40"
            : "bg-(--color-surface)",
        "hover:bg-(--color-surface-hover)",
        "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-(--color-primary)",
      ].join(" ")}
      style={{ height: rowHeight }}
    >
      {selectionMode === "multiple" ? (
        <td
          className={`p-0 align-middle`}
          style={{
            width: TABLE_SELECTION_COL_WIDTH,
            minWidth: TABLE_SELECTION_COL_WIDTH,
            maxWidth: TABLE_SELECTION_COL_WIDTH,
          }}
        >
          <div className="flex items-center justify-center" style={{ minHeight: rowHeight - 4 }}>
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
        const sizing = sizingByColumnId.get(cell.column.id);
        const isGrow = sizing?.isGrow ?? false;
        return (
          <td
            key={cell.id}
            className={[
              `${paddingX} ${paddingY} align-middle`,
              isGrow ? "min-w-0" : "",
              alignClass(def?.align),
              def?.cellClassName ?? "",
            ].join(" ")}
            style={{
              width: isGrow ? undefined : sizing?.width,
              minWidth: sizing?.minWidth,
              maxWidth: sizing?.maxWidth,
            }}
          >
            <div
              className={cellContentClass(def?.align)}
              style={{ minHeight: rowHeight - 4 }}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          </td>
        );
      })}
    </tr>
  );
}

const DataRow = React.memo(DataRowImpl) as typeof DataRowImpl;
