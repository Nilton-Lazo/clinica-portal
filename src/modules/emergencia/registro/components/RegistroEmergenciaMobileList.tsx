import { ShieldCheck, ClipboardList } from "lucide-react";
import type {
  RegistroEmergencia,
  PaginatedResponse,
} from "../../types/registroEmergencia.types";
import { MobileEntityList } from "../../../../shared/crud/MobileEntityList";
import { PaginationFooter } from "../../../../shared/crud/PaginationFooter";

function EstadoEmergenciaBadge({ value }: { value?: string | null }) {
  if (!value) return null;
  const v = value.trim().toUpperCase();
  const base =
    "inline-flex items-center justify-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase";
  if (v === "ATENDIDO") {
    return (
      <span className={`${base} border-(--color-success) text-(--color-success) bg-(--color-success)/5`}>
        <ShieldCheck className="h-3 w-3" aria-hidden="true" />
        Atendido
      </span>
    );
  }
  if (v === "REGISTRADO") {
    return (
      <span className={`${base} border-(--color-primary) text-(--color-primary) bg-(--color-primary)/5`}>
        <ClipboardList className="h-3 w-3" aria-hidden="true" />
        Registrado
      </span>
    );
  }
  return <span className="text-(--color-text-secondary) text-xs">{value}</span>;
}

export default function RegistroEmergenciaMobileList(props: {
  data: PaginatedResponse<RegistroEmergencia>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: RegistroEmergencia) => void;
  page: number;
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
}) {
  const { data, loading, selectedId, onSelect, onPrev, onNext, onFirst, onLast } = props;

  return (
    <div className="lg:hidden">
      <MobileEntityList
        rows={data.data}
        loading={loading}
        selectedId={selectedId}
        getRowId={(x) => x.id}
        onSelect={onSelect}
        renderMain={(x) => (
          <div className="flex flex-col gap-1.5 min-w-0 w-full">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-(--color-text-primary) text-[15px] truncate">
                <span className="tabular-nums">{x.orden}</span> · <span className="tabular-nums">{x.hora || "—"}</span>
              </div>
              <EstadoEmergenciaBadge value={x.estado} />
            </div>
            <div className="text-sm font-medium text-(--color-text-primary) leading-snug">
              {x.apellidos_nombres}
            </div>
            <div className="text-xs text-(--color-text-secondary) flex items-center gap-1.5 flex-wrap">
              <span>HC: {x.numero_hc}</span>
              <span className="text-(--color-text-muted)">•</span>
              <span>Cuenta: {x.numero_cuenta || "—"}</span>
            </div>
            <div className="text-xs text-(--color-text-secondary) flex items-center gap-1.5 flex-wrap">
              <span>Tópico: {x.topico ? (x.topico.match(/^\d+\s*·\s*(.+)$/) ? x.topico.replace(/^\d+\s*·\s*/, "").trim() : x.topico) : "—"}</span>
              <span className="text-(--color-text-muted)">•</span>
              <span>Sexo: {x.sexo || "—"}</span>
            </div>
          </div>
        )}
        emptyText="No hay registros de emergencia."
      />
      <PaginationFooter
        meta={data.meta}
        variant="mobile"
        onPrev={onPrev}
        onNext={onNext}
        onFirst={onFirst}
        onLast={onLast}
      />
    </div>
  );
}
