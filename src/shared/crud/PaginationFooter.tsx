import type { ReactNode } from "react";
import type { PaginationMeta } from "../types/pagination";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const defaultMeta: PaginationMeta = {
  current_page: 1,
  per_page: 25,
  total: 0,
  last_page: 1,
};

export function PaginationFooter(props: {
  meta?: PaginationMeta | null;
  variant: "desktop" | "mobile";
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
  leadingActions?: ReactNode;
  hidePagination?: boolean;
}) {
  const { variant, onPrev, onNext, onFirst, onLast, leadingActions, hidePagination = false } = props;
  const meta = props.meta ?? defaultMeta;

  const page = meta.current_page;
  const last = Math.max(1, meta.last_page);

  const start = meta.total === 0 ? 0 : (page - 1) * meta.per_page + 1;
  const end = Math.min(page * meta.per_page, meta.total);

  const btn =
    "inline-flex h-9 w-9 items-center justify-center rounded-md bg-(--color-panel-context) text-(--color-base-primary) transition-colors hover:bg-(--color-surface-hover) active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:hover:bg-(--color-panel-context)";

  const showFirstLast = onFirst != null || onLast != null;

  return (
    <div
      className={[
        "mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-(--color-text-secondary)",
        variant === "mobile" ? "gap-2" : "",
      ].join(" ")}
    >
      {variant === "desktop" ? (
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span>
            Mostrando {start} – {end} de {meta.total}
          </span>
          {leadingActions}
        </div>
      ) : (
        <div className="text-xs tabular-nums">
          {page} / {last}
        </div>
      )}

      {!hidePagination ? (
      <div className="flex items-center gap-1 sm:gap-2">
        {showFirstLast && onFirst != null ? (
          <button
            type="button"
            className={btn}
            disabled={page <= 1}
            onClick={onFirst}
            aria-label="Primera página"
            title="Primera página"
          >
            <ChevronsLeft className="h-4 w-4" strokeWidth={2} />
          </button>
        ) : null}

        <button
          type="button"
          className={btn}
          disabled={page <= 1}
          onClick={onPrev}
          aria-label="Página anterior"
          title="Anterior"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>

        {variant === "desktop" ? (
          <span className="min-w-28 rounded-md border border-(--border-color-default) bg-(--color-surface) px-3 py-1.5 text-center text-sm tabular-nums text-(--color-text-primary)">
            Página {page} de {last}
          </span>
        ) : null}

        <button
          type="button"
          className={btn}
          disabled={page >= last}
          onClick={onNext}
          aria-label="Página siguiente"
          title="Siguiente"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>

        {showFirstLast && onLast != null ? (
          <button
            type="button"
            className={btn}
            disabled={page >= last}
            onClick={onLast}
            aria-label="Última página"
            title="Última página"
          >
            <ChevronsRight className="h-4 w-4" strokeWidth={2} />
          </button>
        ) : null}
      </div>
      ) : null}
    </div>
  );
}
