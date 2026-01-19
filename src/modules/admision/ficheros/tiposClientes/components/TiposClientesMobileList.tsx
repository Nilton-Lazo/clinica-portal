import type { PaginatedResponse, TipoCliente } from "../../types/tiposClientes.types";
import { StatusBadge } from "../../components/StatusBadge";
import { MobileEntityList } from "../../../../../shared/crud/MobileEntityList";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";

export default function TiposClientesMobileList(props: {
  data: PaginatedResponse<TipoCliente>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: TipoCliente) => void;
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
              <span className="tabular-nums">{x.codigo || "—"}</span> · {x.descripcion_tipo_cliente || "—"}
            </div>
          </div>
        )}
        renderRight={(x) => <StatusBadge status={x.estado} />}
      />

      <PaginationFooter meta={data.meta} variant="mobile" onPrev={onPrev} onNext={onNext} />
    </div>
  );
}
