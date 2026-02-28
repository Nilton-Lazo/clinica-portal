import type { RecargoNocheRegla } from "../../services/recargoNoche.service";
import type { PaginationMeta } from "../../../../shared/types/pagination";
import { StatusBadge } from "../../components/StatusBadge";
import { PaginationFooter } from "../../../../shared/crud/PaginationFooter";

export default function RecargoNocheMobileList(props: {
  reglas: RecargoNocheRegla[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (r: RecargoNocheRegla) => void;
  paginationMeta?: PaginationMeta | null;
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
}) {
  const { reglas, loading, selectedId, onSelect, paginationMeta, onPrev, onNext, onFirst, onLast } = props;

  return (
    <div className="lg:hidden">
      <div className="space-y-2">
        {loading ? (
          <div className="rounded-2xl border border-(--border-color-default) p-4 text-sm text-(--color-text-secondary)">
            Cargando…
          </div>
        ) : reglas.length === 0 ? (
          <div className="rounded-2xl border border-(--border-color-default) p-4 text-sm text-(--color-text-secondary)">
            No hay registros.
          </div>
        ) : (
          reglas.map((r) => {
            const active = selectedId === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelect(r)}
                className={[
                  "w-full rounded-2xl border border-(--border-color-default) p-4 text-left",
                  "transition-transform duration-150 active:scale-[0.99]",
                  active ? "bg-(--color-surface-hover)" : "bg-(--color-surface)",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-(--color-text-primary)">
                      <span className="tabular-nums">{r.categoria_codigo ?? "—"}</span>
                      <span className="ml-2">{r.categoria_nombre ?? `Categoría ${r.tarifa_categoria_id}`}</span>
                    </div>
                    <div className="mt-1 text-xs text-(--color-text-secondary)">
                      {r.porcentaje}% · {r.hora_desde?.slice(0, 5) ?? "—"} – {r.hora_hasta?.slice(0, 5) ?? "—"}
                    </div>
                  </div>
                  <StatusBadge status={r.estado} />
                </div>
              </button>
            );
          })
        )}
      </div>
      <PaginationFooter
        meta={paginationMeta}
        variant="mobile"
        onPrev={onPrev}
        onNext={onNext}
        onFirst={onFirst}
        onLast={onLast}
      />
    </div>
  );
}
