import * as React from "react";
import { Columns3, Download, RefreshCw } from "lucide-react";
import type { DataGridColumnDef } from "./types";
import { DataGridColumnPicker } from "./DataGridColumnPicker";

const iconBtn =
  "inline-flex h-9 w-9 items-center justify-center rounded-md border border-(--border-color-default) bg-(--color-surface) text-(--color-text-secondary) transition-colors hover:border-(--color-primary)/40 hover:bg-(--color-surface-hover) hover:text-(--color-text-primary) disabled:pointer-events-none disabled:opacity-40";

export function DataGridFooterActions<T>(props: {
  loading?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  exportDisabled?: boolean;
  columns?: DataGridColumnDef<T>[];
  hiddenColumnIds?: string[];
  onToggleColumn?: (columnId: string) => void;
}) {
  const { loading, onRefresh, onExport, exportDisabled, columns, hiddenColumnIds = [], onToggleColumn } = props;
  const [open, setOpen] = React.useState(false);
  const columnsBtnRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (columnsBtnRef.current?.contains(target)) return;
      if (target.closest("[data-datagrid-column-picker]")) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!onRefresh && !onExport && !columns) return null;

  return (
    <div className="flex items-center gap-1">
      {onRefresh ? (
        <button
          type="button"
          className={iconBtn}
          onClick={onRefresh}
          disabled={loading}
          title="Actualizar lista"
          aria-label="Actualizar lista"
        >
          <RefreshCw className={["h-4 w-4", loading ? "animate-spin" : ""].filter(Boolean).join(" ")} />
        </button>
      ) : null}

      {onExport ? (
        <button
          type="button"
          className={iconBtn}
          onClick={onExport}
          disabled={exportDisabled}
          title="Exportar CSV (página actual)"
          aria-label="Exportar CSV"
        >
          <Download className="h-4 w-4" />
        </button>
      ) : null}

      {columns && onToggleColumn ? (
        <>
          <button
            ref={columnsBtnRef}
            type="button"
            className={iconBtn}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            title="Mostrar u ocultar columnas"
            aria-label="Columnas visibles"
          >
            <Columns3 className="h-4 w-4" />
          </button>
          <DataGridColumnPicker
            open={open}
            anchorRef={columnsBtnRef}
            columns={columns}
            hiddenColumnIds={hiddenColumnIds}
            onToggleColumn={onToggleColumn}
            onClose={() => setOpen(false)}
          />
        </>
      ) : null}
    </div>
  );
}
