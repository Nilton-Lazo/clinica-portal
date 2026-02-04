import type { AgendaCita, AgendaCitasPaginated } from "../types/agendaMedica.types";
import { MobileEntityList } from "../../../../../shared/crud/MobileEntityList";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";
import { StatusBadge } from "../../../ficheros/components/StatusBadge";

export default function AgendaMedicaMobileList(props: {
  data: AgendaCitasPaginated;
  loading: boolean;
  page: number;
  onPrev: () => void;
  onNext: () => void;
  selectedId: number | null;
  onSelect: (row: AgendaCita) => void;
  onLongPress?: (row: AgendaCita) => void;
}) {
  const { data, loading, onPrev, onNext, selectedId, onSelect, onLongPress } = props;

  const formatHora = (value?: string | null) => {
    if (!value) return "—";
    const parts = value.split(":");
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return value;
  };

  const iafaLabel = (x: AgendaCita) =>
    x.iafa?.descripcion_corta ||
    x.iafa?.razon_social ||
    x.iafa?.codigo ||
    (x.iafa_id ? String(x.iafa_id) : "—");

  return (
    <div className="lg:hidden">
      <MobileEntityList<AgendaCita>
        rows={data.data}
        loading={loading}
        selectedId={selectedId}
        getRowId={(x) => x.id}
        onSelect={onSelect}
        onLongPress={onLongPress}
        renderMain={(x) => (
          <div className="min-w-0">
            <div className="text-sm font-semibold text-(--color-text-primary) tabular-nums">
              {x.codigo || "—"} · {formatHora(x.hora)}
            </div>
            <div className="mt-1 text-sm text-(--color-text-primary) truncate">
              {x.paciente_nombre || "—"}
            </div>
            <div className="mt-1 text-xs text-(--color-text-secondary)">
              HC: {x.hc || "—"} · Ref: {x.nr || "—"}
            </div>
            <div className="mt-1 text-xs text-(--color-text-secondary)">IAFA: {iafaLabel(x)}</div>
          </div>
        )}
        renderRight={(x) => <StatusBadge status={x.estado} />}
      />

      <PaginationFooter meta={data.meta} variant="mobile" onPrev={onPrev} onNext={onNext} />
    </div>
  );
}
