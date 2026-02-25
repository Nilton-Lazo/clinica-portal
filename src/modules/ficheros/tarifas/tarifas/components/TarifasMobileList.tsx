import type { PaginatedResponse, Tarifa } from "../../types/tarifas.types";
import { StatusBadge } from "../../components/StatusBadge";
import { MobileEntityList } from "../../../../../shared/crud/MobileEntityList";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";

export default function TarifasMobileList(props: {
  data: PaginatedResponse<Tarifa>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Tarifa) => void;
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
              <span className="tabular-nums">{x.codigo || "—"}</span> · {x.descripcion_tarifa || "—"}
            </div>
            {x.tarifa_base ? <div className="mt-1 text-xs text-(--color-text-secondary)">Tarifario base</div> : null}
          </div>
        )}
        renderRight={(x) => <StatusBadge status={x.estado} />}
      />

      <PaginationFooter meta={data.meta} variant="mobile" onPrev={onPrev} onNext={onNext} />
    </div>
  );
}
