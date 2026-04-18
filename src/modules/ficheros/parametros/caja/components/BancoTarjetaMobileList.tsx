import { StatusBadge } from "../../../components/StatusBadge";
import { MobileEntityList } from "../../../../../shared/crud/MobileEntityList";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";
import type { BancoTarjetaCajaItem, BancoTarjetaCajaListResponse } from "../services/bancoTarjetaCaja.service";

export default function BancoTarjetaMobileList(props: {
  data: BancoTarjetaCajaListResponse;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: BancoTarjetaCajaItem) => void;
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
            <span className="tabular-nums">{x.codigo}</span> · {x.descripcion}
          </div>
        )}
        renderSub={(x) => (
          <div className="text-xs text-(--color-text-secondary) wrap-anywhere">
            {(x.resumen_secundario ?? "").trim() || "—"}
          </div>
        )}
        renderRight={(x) => <StatusBadge status={x.estado} />}
      />
      <PaginationFooter meta={data.meta} variant="mobile" onPrev={onPrev} onNext={onNext} onFirst={onFirst} onLast={onLast} />
    </div>
  );
}
