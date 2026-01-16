import type { Consultorio, PaginatedResponse } from "../../types/consultorios.types";
import { StatusBadge } from "../../components/StatusBadge";
import { MobileEntityList } from "../../../../../shared/crud/MobileEntityList";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";

export default function ConsultoriosMobileList(props: {
  data: PaginatedResponse<Consultorio>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Consultorio) => void;
  page: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { data, loading, selectedId, onSelect, onPrev, onNext } = props;

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
              <span className="tabular-nums">{x.abreviatura}</span> · {x.descripcion}
            </div>
            {x.es_tercero ? (
              <div className="mt-1 text-xs text-(--color-text-secondary)">Consultorio de terceros</div>
            ) : null}
          </div>
        )}
        renderRight={(x) => <StatusBadge status={x.estado} />}
      />

      <PaginationFooter meta={data.meta} variant="mobile" onPrev={onPrev} onNext={onNext} />
    </div>
  );
}
