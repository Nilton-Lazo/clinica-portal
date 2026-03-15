import type { ParamOption, PaginatedResponse } from "../types/paramOption.types";
import { StatusBadge } from "../../../components/StatusBadge";
import { MobileEntityList } from "../../../../../shared/crud/MobileEntityList";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";

export default function ParamOptionMobileList(props: {
  data: PaginatedResponse<ParamOption>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: ParamOption) => void;
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
          <div className="text-sm font-semibold text-(--color-text-primary)">
            <span className="tabular-nums">{x.codigo}</span> · {x.descripcion}
          </div>
        )}
        renderRight={(x) => <StatusBadge status={x.estado} />}
      />
      <PaginationFooter meta={data.meta} variant="mobile" onPrev={onPrev} onNext={onNext} onFirst={onFirst} onLast={onLast} />
    </div>
  );
}
