import type { Cliente, ClienteTipo, PaginatedResponse } from "../../types/clientes.types";
import { StatusBadge } from "../../components/StatusBadge";
import { MobileEntityList } from "../../../../shared/crud/MobileEntityList";
import { PaginationFooter } from "../../../../shared/crud/PaginationFooter";

function tipoLabel(t: ClienteTipo): string {
  return t === "ADMINISTRATIVO" ? "Administrativo" : "Asistencial";
}

export default function ClientesMobileList(props: {
  data: PaginatedResponse<Cliente>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Cliente) => void;
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
              <span className="tabular-nums">{x.codigo || "—"}</span> · {x.nombre || "—"}
            </div>
            <div className="mt-1 text-xs text-(--color-text-secondary) truncate">
              {tipoLabel(x.tipo)}
              {` · ${x.dni_o_ruc}`}
              {x.telefono ? ` · Tel ${x.telefono}` : ""}
            </div>
          </div>
        )}
        renderRight={(x) => <StatusBadge status={x.estado} />}
      />

      <PaginationFooter meta={data.meta} variant="mobile" onPrev={onPrev} onNext={onNext} onFirst={onFirst} onLast={onLast} />
    </div>
  );
}
