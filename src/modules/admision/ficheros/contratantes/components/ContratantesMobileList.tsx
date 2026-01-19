import type { Contratante, PaginatedResponse } from "../../types/contratantes.types";
import { StatusBadge } from "../../components/StatusBadge";
import { MobileEntityList } from "../../../../../shared/crud/MobileEntityList";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";

export default function ContratantesMobileList(props: {
  data: PaginatedResponse<Contratante>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Contratante) => void;
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
              <span className="tabular-nums">{x.codigo || "—"}</span> · {x.razon_social || "—"}
            </div>
            <div className="mt-1 text-xs text-(--color-text-secondary) truncate">
              {x.ruc ? `RUC ${x.ruc}` : ""}
              {x.ruc && x.telefono ? " · " : ""}
              {x.telefono ? `Tel ${x.telefono}` : ""}
            </div>
          </div>
        )}
        renderRight={(x) => <StatusBadge status={x.estado} />}
      />

      <PaginationFooter meta={data.meta} variant="mobile" onPrev={onPrev} onNext={onNext} />
    </div>
  );
}
