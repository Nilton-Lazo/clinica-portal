import { StatusBadge } from "../../../components/StatusBadge";
import { MobileEntityList } from "../../../../../shared/crud/MobileEntityList";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";
import type { NumeracionComprobanteCajaItem, NumeracionComprobanteCajaListResponse } from "../services/numeracionComprobanteCaja.service";

export default function NumeracionComprobanteMobileList(props: {
  data: NumeracionComprobanteCajaListResponse;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: NumeracionComprobanteCajaItem) => void;
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
          <div className="text-sm font-semibold text-(--color-text-primary)">
            {x.tipo_documento_codigo} · {x.serie} · <span className="tabular-nums">{x.numero_formateado}</span>
          </div>
        )}
        renderRight={(x) => <StatusBadge status={x.estado} />}
      />
      <PaginationFooter meta={data.meta} variant="mobile" onPrev={onPrev} onNext={onNext} onFirst={onFirst} onLast={onLast} />
    </div>
  );
}
