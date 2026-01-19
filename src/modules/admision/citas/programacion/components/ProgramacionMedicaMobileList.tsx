import type { ProgramacionMedica, ProgramacionMedicaPaginated } from "../../types/programacionMedica.types";
import { MobileEntityList } from "../../../../../shared/crud/MobileEntityList";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";
import { StatusBadge } from "../../../ficheros/components/StatusBadge";
import { dmyFromYmdString } from "../../utils/programacionMedica.utils";

function mainText(x: ProgramacionMedica) {
  const m = x.medico;
  const ap = m ? [m.apellido_paterno, m.apellido_materno].filter(Boolean).join(" ").trim() : "";
  const nm = m ? String(m.nombres ?? "").trim() : "";
  const medico = [ap, nm].filter(Boolean).join(" ").trim();
  return medico || "—";
}

function subText(x: ProgramacionMedica) {
  const e = x.especialidad ? `${x.especialidad.codigo} · ${x.especialidad.descripcion}` : "—";
  const t = x.turno ? `${x.turno.codigo} · ${x.turno.descripcion}` : "—";
  return `${e} · ${t}`;
}

export default function ProgramacionMedicaMobileList(props: {
  data: ProgramacionMedicaPaginated;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: ProgramacionMedica) => void;
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
              <span className="tabular-nums">{x.codigo}</span> ·{" "}
              <span className="tabular-nums">{dmyFromYmdString(x.fecha)}</span>
            </div>
            <div className="mt-1 text-sm text-(--color-text-primary) truncate">{mainText(x)}</div>
            <div className="mt-1 text-xs text-(--color-text-secondary)">{subText(x)}</div>
            <div className="mt-1 text-xs text-(--color-text-secondary)">
              Cupos: <span className="tabular-nums">{String(x.cupos ?? 0)}</span>
            </div>
          </div>
        )}
        renderRight={(x) => <StatusBadge status={x.estado} />}
        emptyText="No hay programaciones."
      />

      <PaginationFooter meta={data.meta} variant="mobile" onPrev={onPrev} onNext={onNext} />
    </div>
  );
}
