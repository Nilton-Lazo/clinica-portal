import * as React from "react";
import { Columns3, Download, RefreshCw } from "lucide-react";
import type { DataGridColumnDef } from "./types";

export function DataGridToolbar<T>(props: {
  title?: string;
  loading?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  exportDisabled?: boolean;
  children?: React.ReactNode;
  columns?: DataGridColumnDef<T>[];
  onToggleColumn?: (columnId: string) => void;
  hiddenColumnIds?: string[];
}) {
  const {
    title,
    loading,
    onRefresh,
    onExport,
    exportDisabled,
    children,
    columns,
    onToggleColumn,
    hiddenColumnIds = [],
  } = props;

  const [columnsOpen, setColumnsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!columnsOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setColumnsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [columnsOpen]);

  const btn =
    "inline-flex h-9 items-center gap-1.5 rounded-md border border-(--border-color-default) bg-(--color-surface) px-3 text-sm font-medium text-(--color-text-primary) transition-colors hover:bg-(--color-surface-hover) disabled:opacity-50 disabled:pointer-events-none";

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      {title ? <div className="mr-auto text-sm font-semibold text-(--color-text-primary)">{title}</div> : null}

      {children}

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {onRefresh ? (
          <button type="button" className={btn} onClick={onRefresh} disabled={loading} aria-label="Actualizar">
            <RefreshCw className={["h-4 w-4", loading ? "animate-spin" : ""].filter(Boolean).join(" ")} />
            Actualizar
          </button>
        ) : null}

        {onExport ? (
          <button
            type="button"
            className={btn}
            onClick={onExport}
            disabled={exportDisabled}
            aria-label="Exportar CSV"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
        ) : null}

        {columns && onToggleColumn ? (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              className={btn}
              onClick={() => setColumnsOpen((v) => !v)}
              aria-expanded={columnsOpen}
              aria-label="Columnas visibles"
            >
              <Columns3 className="h-4 w-4" />
              Columnas
            </button>
            {columnsOpen ? (
              <div className="absolute right-0 z-20 mt-1 min-w-44 rounded-md border border-(--border-color-default) bg-(--color-surface) p-2 shadow-lg">
                {columns
                  .filter((c) => c.enableHiding !== false)
                  .map((col) => {
                    const hidden = hiddenColumnIds.includes(col.id);
                    return (
                      <label
                        key={col.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-(--color-surface-hover)"
                      >
                        <input
                          type="checkbox"
                          checked={!hidden}
                          onChange={() => onToggleColumn(col.id)}
                          className="accent-(--color-primary)"
                        />
                        {col.header}
                      </label>
                    );
                  })}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
