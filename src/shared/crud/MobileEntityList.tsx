import * as React from "react";

export function MobileEntityList<T>(props: {
  rows: T[];
  loading: boolean;
  selectedId: string | number | null;
  getRowId: (row: T) => string | number;
  onSelect: (row: T) => void;
  renderMain: (row: T) => React.ReactNode;
  renderRight?: (row: T) => React.ReactNode;
  emptyText?: string;
}) {
  const { rows, loading, selectedId, getRowId, onSelect, renderMain, renderRight, emptyText } = props;

  if (loading) {
    return (
      <div className="rounded-2xl border border-(--border-color-default) p-4 text-sm text-(--color-text-secondary)">
        Cargando…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-(--border-color-default) p-4 text-sm text-(--color-text-secondary)">
        {emptyText ?? "No hay registros."}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const id = getRowId(row);
        const active = selectedId != null && String(selectedId) === String(id);

        return (
          <button
            key={String(id)}
            type="button"
            onClick={() => onSelect(row)}
            className={[
              "w-full rounded-2xl border border-(--border-color-default) p-4 text-left",
              "transition-transform duration-150 active:scale-[0.99]",
              active ? "bg-(--color-surface-hover)" : "bg-(--color-surface)",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">{renderMain(row)}</div>
              {renderRight ? renderRight(row) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
