import * as React from "react";

export type DataTableColumn<T> = {
  key: string;
  header: React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  render: (row: T) => React.ReactNode;
};

export function DataTable<T>(props: {
  rows: T[];
  columns: DataTableColumn<T>[];
  loading: boolean;
  selectedId: string | number | null;
  getRowId: (row: T) => string | number;
  onSelect: (row: T) => void;
  onDoubleClick?: (row: T) => void;
  emptyText?: string;
}) {
  const { rows, columns, loading, selectedId, getRowId, onSelect, onDoubleClick, emptyText } = props;

  const showOverlay = loading && rows.length > 0;
  const showLoadingRow = loading && rows.length === 0;
  const showEmptyRow = !loading && rows.length === 0;

  return (
    <div className="relative rounded-2xl border border-(--border-color-default) overflow-hidden bg-(--color-surface)">
      <div className="min-h-0 overflow-auto app-scrollbar app-scrollbar-no-gutter">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-(--color-primary) text-(--color-text-inverse)">
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
            {showLoadingRow ? (
              <tr>
                <td className="px-3 py-3 text-(--color-text-secondary)" colSpan={columns.length}>
                  Cargando…
                </td>
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
                    onClick={() => onSelect(row)}
                    onDoubleClick={() => onDoubleClick?.(row)}
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
      {showOverlay ? (
        <div
          className="absolute inset-0 flex items-center justify-center bg-(--color-surface)/80 backdrop-blur-[2px] z-10"
          aria-busy="true"
          aria-live="polite"
        >
          <span className="text-sm font-medium text-(--color-text-secondary)">Cargando…</span>
        </div>
      ) : null}
    </div>
  );
}
