import type { PaginatedResponse, Turno } from "../../types/turnos.types";
import { StatusBadge } from "../../components/StatusBadge";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

function duracionLabel(x: Turno): string {
  const d = (x.duracion_hhmm ?? "").trim();
  if (d) return d;
  const m = Number.isFinite(x.duracion_minutos) ? Math.max(0, Math.trunc(x.duracion_minutos)) : 0;
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export default function TurnosMobileList(props: {
  data: PaginatedResponse<Turno>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Turno) => void;
  page: number;
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
}) {
  const { data, loading, selectedId, onSelect, page, onPrev, onNext, onFirst, onLast } = props;

  return (
    <div className="lg:hidden">
      <div className="space-y-2">
        {loading ? (
          <div className="rounded-2xl border border-(--border-color-default) p-4 text-sm text-(--color-text-secondary)">
            Cargando…
          </div>
        ) : data.data.length === 0 ? (
          <div className="rounded-2xl border border-(--border-color-default) p-4 text-sm text-(--color-text-secondary)">
            No hay registros.
          </div>
        ) : (
          data.data.map((x) => {
            const active = selectedId === x.id;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => onSelect(x)}
                className={[
                  "w-full rounded-2xl border border-(--border-color-default) p-4 text-left",
                  "transition-transform duration-150 active:scale-[0.99]",
                  active ? "bg-(--color-surface-hover)" : "bg-(--color-surface)",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-(--color-text-primary)">
                      <span className="tabular-nums">{x.codigo ?? "—"}</span> · {x.descripcion ?? ""}
                    </div>
                    <div className="mt-1 text-xs text-(--color-text-secondary)">
                      {x.hora_inicio ?? "—"} – {x.hora_fin ?? "—"} · {duracionLabel(x)}
                    </div>
                  </div>
                  <StatusBadge status={x.estado} />
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-(--color-text-secondary)">
        <div className="text-xs tabular-nums">
          {data.meta.current_page} / {data.meta.last_page}
        </div>
        <div className="flex items-center gap-1">
          {onFirst != null ? (
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-(--color-panel-context) text-(--color-base-primary) transition-colors hover:bg-(--color-surface-hover) active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              disabled={page <= 1}
              onClick={onFirst}
              aria-label="Primera página"
            >
              <ChevronsLeft className="h-4 w-4" strokeWidth={2} />
            </button>
          ) : null}
          <button
            type="button"
            className="h-9 rounded-md px-3 bg-(--color-panel-context) text-(--color-base-primary) transition-colors hover:bg-(--color-surface-hover) active:scale-[0.98] disabled:opacity-50"
            disabled={page <= 1}
            onClick={onPrev}
          >
            Anterior
          </button>
          <button
            type="button"
            className="h-9 rounded-md px-3 bg-(--color-panel-context) text-(--color-base-primary) transition-colors hover:bg-(--color-surface-hover) active:scale-[0.98] disabled:opacity-50"
            disabled={page >= data.meta.last_page}
            onClick={onNext}
          >
            Siguiente
          </button>
          {onLast != null ? (
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-(--color-panel-context) text-(--color-base-primary) transition-colors hover:bg-(--color-surface-hover) active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              disabled={page >= data.meta.last_page}
              onClick={onLast}
              aria-label="Última página"
            >
              <ChevronsRight className="h-4 w-4" strokeWidth={2} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
