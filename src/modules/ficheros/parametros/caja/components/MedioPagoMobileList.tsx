import { StatusBadge } from "../../../components/StatusBadge";
import { MobileEntityList } from "../../../../../shared/crud/MobileEntityList";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";
import type { MedioPagoCajaItem, MedioPagoCajaListResponse } from "../services/medioPagoCaja.service";

export default function MedioPagoMobileList(props: {
  data: MedioPagoCajaListResponse;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: MedioPagoCajaItem) => void;
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
          <div>
            <div className="text-sm font-semibold text-(--color-text-primary)">
              <span className="tabular-nums">{x.codigo}</span> · {x.descripcion}
            </div>
            <div className="text-xs text-(--color-text-secondary)">{x.forma_pago_labels.join(", ")}</div>
          </div>
        )}
        renderRight={(x) => <StatusBadge status={x.estado} />}
      />
      <PaginationFooter meta={data.meta} variant="mobile" onPrev={onPrev} onNext={onNext} onFirst={onFirst} onLast={onLast} />
    </div>
  );
}
