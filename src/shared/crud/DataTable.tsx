import * as React from "react";

export type DataTableColumn<T> = {
  key: string;
  header: React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  render: (row: T) => React.ReactNode;
};

function TableLoadingOverlay() {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-(--color-surface) opacity-95 z-10"
      aria-busy="true"
      aria-live="polite"
    >
      <div
        className="h-8 w-8 shrink-0 rounded-full border-2 border-(--color-primary) border-t-transparent animate-spin"
        aria-hidden
      />
      <span className="text-sm font-medium text-(--color-text-secondary)">Cargando…</span>
    </div>
  );
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
  emptyText?: string;
}) {
  const { rows, columns, loading, selectedId, getRowId, onSelect, onDoubleClick, onContextMenu, emptyText } = props;

  const showOverlay = loading;
  const showEmptyRow = !loading && rows.length === 0;
  const showPlaceholderRow = loading && rows.length === 0;

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-(--border-color-default) bg-(--color-surface)">
      <div className="min-h-0 min-w-0 flex-1 overflow-auto app-scrollbar app-scrollbar-no-gutter">
        <table className="w-full min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-1 bg-(--color-primary) text-(--color-text-inverse)">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={[
                    "px-3 py-2 font-semibold bg-(--color-primary)",
                    c.headerClassName ?? "text-left",
                  ].join(" ")}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {showPlaceholderRow ? (
              <tr>
                <td className="h-24" colSpan={columns.length} aria-hidden />
              </tr>
            ) : showEmptyRow ? (
              <tr>
                <td className="px-3 py-3 text-(--color-text-secondary)" colSpan={columns.length}>
                  {emptyText ?? "No hay registros."}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const id = getRowId(row);
                const active = selectedId != null && String(selectedId) === String(id);
                return (
                  <tr
                    key={String(id)}
                    onClick={(e) => onSelect(row, e)}
                    onDoubleClick={() => onDoubleClick?.(row)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      onContextMenu?.(row, e);
                    }}
                    className={[
                      "cursor-pointer border-t border-(--border-color-default)",
                      "transition-colors",
                      active ? "bg-(--color-surface-hover)" : "bg-(--color-surface)",
                      "hover:bg-(--color-surface-hover)",
                    ].join(" ")}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={c.cellClassName ?? "px-3 py-2"}>
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {showOverlay ? <TableLoadingOverlay /> : null}
    </div>
  );
}
