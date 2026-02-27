import type { AgendaCita, AgendaCitasPaginated, CitaAtencionEstado } from "../types/agendaMedica.types";
import { MobileEntityList } from "../../../../../shared/crud/MobileEntityList";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";
import { CitaAtencionBadge } from "./CitaAtencionBadge";

export default function AgendaMedicaMobileList(props: {
  data: AgendaCitasPaginated;
  loading: boolean;
  page: number;
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
  selectedId: number | null;
  onSelect: (row: AgendaCita) => void;
  onLongPress?: (row: AgendaCita) => void;
}) {
  const { data, loading, onPrev, onNext, onFirst, onLast, selectedId, onSelect, onLongPress } = props;

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

  const hIngLabel = (x: AgendaCita) =>
    x.estado_atencion === "ATENDIDO" && x.hora_ingreso
      ? (x.hora_ingreso.length >= 5 ? x.hora_ingreso.slice(0, 5) : x.hora_ingreso)
      : x.estado_atencion === "PENDIENTE"
        ? "P"
        : x.estado_atencion === "ATENDIDO"
          ? "A"
          : "—";

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
              {x.codigo || "—"} · {formatHora(x.hora)} · H. Ing.: {hIngLabel(x)}
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
        renderRight={(x) => (
          <CitaAtencionBadge estado={(x.estado_atencion ?? "PENDIENTE") as CitaAtencionEstado} />
        )}
      />

      <PaginationFooter meta={data.meta} variant="mobile" onPrev={onPrev} onNext={onNext} onFirst={onFirst} onLast={onLast} />
    </div>
  );
}
