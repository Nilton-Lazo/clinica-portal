import type { PresupuestoListaResponse } from "../types/presupuestoLista.types";
import { MobileEntityList } from "../../../../../shared/crud/MobileEntityList";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";
import { EstadoFacturacionBadge } from "../../agenda/components/EstadoFacturacionBadge";

function formatDMY(iso?: string | null): string {
  if (!iso) return "—";
  const s = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

export default function PresupuestosMobileList(props: {
  data: PresupuestoListaResponse;
  loading: boolean;
  onOpenRow: (id: number) => void;
  onPrefetchRow?: (id: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onFirst: () => void;
  onLast: () => void;
}) {
  const { data, loading, onOpenRow, onPrefetchRow, onPrev, onNext, onFirst, onLast } = props;

  return (
    <div className="lg:hidden">
      <MobileEntityList
        rows={data.data}
        loading={loading}
        selectedId={null}
        getRowId={(x) => x.id}
        onSelect={(row) => onOpenRow(row.id)}
        onRowPointerEnter={onPrefetchRow ? (row) => onPrefetchRow(row.id) : undefined}
        renderMain={(x) => (
          <div className="min-w-0">
            <div className="text-sm font-semibold text-(--color-text-primary)">
              <span className="tabular-nums">{x.codigo?.trim() ? x.codigo : "—"}</span>
              {x.hc?.trim() ? <span className="text-(--color-text-secondary)"> · HC {x.hc}</span> : null}
            </div>
            <div className="mt-0.5 truncate text-xs text-(--color-text-secondary)">
              {x.nombre_completo?.trim() ? x.nombre_completo : "—"}
              {x.nr ? ` · Ref: ${x.nr}` : ""}
            </div>
            {x.plan?.trim() ? (
              <div className="mt-0.5 truncate text-xs text-(--color-text-secondary)">Plan: {x.plan}</div>
            ) : null}
            <div className="mt-0.5 text-xs text-(--color-text-secondary)">Vence: {formatDMY(x.vigencia_hasta)}</div>
          </div>
        )}
        renderRight={(x) => <EstadoFacturacionBadge estado={x.estado} mode="presupuesto" size="sm" />}
      />
      <PaginationFooter meta={data.meta} variant="mobile" onPrev={onPrev} onNext={onNext} onFirst={onFirst} onLast={onLast} />
    </div>
  );
}
