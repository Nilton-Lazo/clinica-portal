import type { Medico, PaginatedResponse } from "../../types/medicos.types";
import { StatusBadge } from "../../components/StatusBadge";
import { MobileEntityList } from "../../../../../shared/crud/MobileEntityList";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";

function fullName(x: Medico): string {
  const ap = (x.apellido_paterno ?? "").trim();
  const am = (x.apellido_materno ?? "").trim();
  const n = (x.nombres ?? "").trim();
  return `${ap} ${am}, ${n}`.trim();
}

export default function MedicosMobileList(props: {
  data: PaginatedResponse<Medico>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Medico) => void;
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
              <span className="tabular-nums">{x.cmp ?? "—"}</span> · {fullName(x)}
            </div>
            {x.tipo_profesional_clinica === "EXTERNO" ? (
              <div className="mt-1 text-xs text-(--color-text-secondary)">Profesional externo</div>
            ) : null}
          </div>
        )}
        renderRight={(x) => <StatusBadge status={x.estado} />}
      />

      <PaginationFooter meta={data.meta} variant="mobile" onPrev={onPrev} onNext={onNext} />
    </div>
  );
}
