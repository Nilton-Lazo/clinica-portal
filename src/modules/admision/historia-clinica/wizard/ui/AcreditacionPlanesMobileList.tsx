import type { AcreditacionPlan, PaginatedResponse } from "../acreditacionPlanes.types";
import { MobileEntityList } from "../../../../../shared/crud/MobileEntityList";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";
import { StatusBadge } from "../../../ficheros/components/StatusBadge";

function planLabel(p: AcreditacionPlan): string {
  const c = (p.tipo_cliente?.codigo ?? "").trim();
  const d = (p.tipo_cliente?.descripcion_tipo_cliente ?? "").trim();
  return c && d ? `${c} · ${d}` : c || d || `#${p.id}`;
}

function formatDateForDisplay(iso: string | null): string {
  const t = (iso ?? "").trim();
  if (!t) return "—";
  if (!/^\d{4}-\d{2}-\d{2}/.test(t)) return t;
  const y = t.slice(0, 4);
  const m = t.slice(5, 7);
  const d = t.slice(8, 10);
  return `${d}/${m}/${y}`;
}

function parentescoLabel(v: string | null): string {
  const s = (v ?? "").toUpperCase();
  if (s === "TITULAR") return "Titular";
  if (s === "CONYUGE") return "Cónyuge";
  if (s === "HIJO") return "Hijo";
  if (s === "PADRE") return "Padre";
  if (s === "MADRE") return "Madre";
  if (s === "OTRO") return "Otro";
  return v ? v : "—";
}

export default function AcreditacionPlanesMobileList(props: {
  data: PaginatedResponse<AcreditacionPlan>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: AcreditacionPlan) => void;
  page: number;
  onPrev: () => void;
  onNext: () => void;
  emptyText?: string;
}) {
  const { data, loading, selectedId, onSelect, onPrev, onNext, emptyText } = props;

  return (
    <div className="lg:hidden">
      <MobileEntityList
        rows={data.data}
        loading={loading}
        selectedId={selectedId}
        getRowId={(x) => x.id}
        onSelect={onSelect}
        emptyText={emptyText}
        renderMain={(p) => (
          <div className="min-w-0">
            <div className="text-sm font-semibold text-(--color-text-primary)">{planLabel(p)}</div>
            <div className="mt-1 text-xs text-(--color-text-secondary)">
              {parentescoLabel(p.parentesco_seguro)} · {formatDateForDisplay(p.fecha_afiliacion)}
            </div>
          </div>
        )}
        renderRight={(p) => <StatusBadge status={p.estado} />}
      />

      <PaginationFooter meta={data.meta} variant="mobile" onPrev={onPrev} onNext={onNext} />
    </div>
  );
}
