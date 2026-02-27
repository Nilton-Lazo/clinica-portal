import type { PacienteListItem, PaginatedResponse } from "../types/historiaClinica.types";
import { MobileEntityList } from "../../../../shared/crud/MobileEntityList";
import { PaginationFooter } from "../../../../shared/crud/PaginationFooter";
import { StatusBadge } from "../../../ficheros/components/StatusBadge";

export default function HistoriaClinicaMobileList(props: {
  data: PaginatedResponse<PacienteListItem>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: PacienteListItem) => void;
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
          <div className="min-w-0">
            <div className="text-sm font-semibold text-(--color-text-primary)">
              <span className="tabular-nums">{x.hc}</span> · {x.nombre_completo?.trim() ? x.nombre_completo : "—"}
            </div>
            <div className="mt-0.5 text-xs text-(--color-text-secondary)">
              {x.parentesco_seguro ?? "—"} {x.nr ? `· Ref: ${x.nr}` : ""}
            </div>
          </div>
        )}
        renderRight={(x) => <StatusBadge status={x.estado} />}
      />

      <PaginationFooter meta={data.meta} variant="mobile" onPrev={onPrev} onNext={onNext} onFirst={onFirst} onLast={onLast} />
    </div>
  );
}
