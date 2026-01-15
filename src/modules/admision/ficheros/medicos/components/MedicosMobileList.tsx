import type { Medico, PaginatedResponse } from "../../types/medicos.types";
import { StatusBadge } from "../../components/StatusBadge";

function fullName(x: Medico): string {
  const ap = (x.apellido_paterno ?? "").trim();
  const am = (x.apellido_materno ?? "").trim();
  const n = (x.nombres ?? "").trim();
  return `${ap} ${am}, ${n}`.trim();
}

export default function MedicosMobileList(props: {
  data: PaginatedResponse<Medico>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Medico) => void;
  page: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { data, loading, selectedId, onSelect, page, onPrev, onNext } = props;

  return (
    <div className="lg:hidden">
      <div className="space-y-2">
        {loading ? (
          <div className="rounded-2xl border border-[var(--border-color-default)] p-4 text-sm text-[var(--color-text-secondary)]">
            Cargando…
          </div>
        ) : data.data.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-color-default)] p-4 text-sm text-[var(--color-text-secondary)]">
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
                  "w-full rounded-2xl border border-[var(--border-color-default)] p-4 text-left",
                  "transition-transform duration-150 active:scale-[0.99]",
                  active ? "bg-[var(--color-surface-hover)]" : "bg-[var(--color-surface)]",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                      <span className="tabular-nums">{x.cmp ?? "—"}</span> · {fullName(x)}
                    </div>
                    {x.tipo_profesional_clinica === "EXTERNO" ? (
                      <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
                        Profesional externo
                      </div>
                    ) : null}
                  </div>
                  <StatusBadge status={x.estado} />
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-sm text-[var(--color-text-secondary)]">
        <button
          type="button"
          className="h-9 rounded-xl px-3 bg-[var(--color-panel-context)] text-[var(--color-base-primary)] transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          disabled={page <= 1}
          onClick={onPrev}
        >
          Anterior
        </button>
        <div>
          {data.meta.current_page} / {data.meta.last_page}
        </div>
        <button
          type="button"
          className="h-9 rounded-xl px-3 bg-[var(--color-panel-context)] text-[var(--color-base-primary)] transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          disabled={page >= data.meta.last_page}
          onClick={onNext}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
