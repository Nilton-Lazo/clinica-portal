import type { PaginationMeta } from "../types/pagination";

export function PaginationFooter(props: {
  meta: PaginationMeta;
  variant: "desktop" | "mobile";
  onPrev: () => void;
  onNext: () => void;
}) {
  const { meta, variant, onPrev, onNext } = props;

  const page = meta.current_page;
  const last = meta.last_page;

  const start = meta.total === 0 ? 0 : (page - 1) * meta.per_page + 1;
  const end = Math.min(page * meta.per_page, meta.total);

  const btn =
    "h-9 rounded-xl px-3 bg-(--color-panel-context) text-(--color-base-primary) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100";

  return (
    <div
      className={[
        "mt-3 flex items-center justify-between text-sm text-(--color-text-secondary)",
        variant === "mobile" ? "gap-2" : "",
      ].join(" ")}
    >
      {variant === "desktop" ? (
        <div>
          Mostrando {start} – {end} de {meta.total}
        </div>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-2">
        <button type="button" className={btn} disabled={page <= 1} onClick={onPrev}>
          Anterior
        </button>

        <div>
          {variant === "desktop" ? `Página ${page} / ${last}` : `${page} / ${last}`}
        </div>

        <button type="button" className={btn} disabled={page >= last} onClick={onNext}>
          Siguiente
        </button>
      </div>
    </div>
  );
}
