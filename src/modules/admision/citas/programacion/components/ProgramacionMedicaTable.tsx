import type { ProgramacionMedica, ProgramacionMedicaPaginated } from "../../types/programacionMedica.types";
import { CrudListGrid } from "../../../../../shared/crud/CrudListGrid";
import type { DataGridColumnDef } from "../../../../../shared/datagrid";
import { StatusBadge } from "../../../../ficheros/components/StatusBadge";
import { dmyFromYmdString } from "../../utils/programacionMedica.utils";

function medicoText(x: ProgramacionMedica) {
  const m = x.medico;
  if (!m) return "—";
  const ap = [m.apellido_paterno, m.apellido_materno].filter(Boolean).join(" ").trim();
  const nm = String(m.nombres ?? "").trim();
  const full = [ap, nm].filter(Boolean).join(" ").trim();
  return full || "—";
}

function especialidadText(x: ProgramacionMedica) {
  const e = x.especialidad;
  if (!e) return "—";
  return `${e.codigo} · ${e.descripcion}`.trim();
}

function consultorioText(x: ProgramacionMedica) {
  const c = x.consultorio;
  if (!c) return "—";
  const a = String(c.abreviatura ?? "").trim();
  const d = String(c.descripcion ?? "").trim();
  return a && d ? `${a} · ${d}` : a || d || "—";
}

function turnoText(x: ProgramacionMedica) {
  const t = x.turno;
  if (!t) return "—";
  const c = String(t.codigo ?? "").trim();
  const d = String(t.descripcion ?? "").trim();
  return c && d ? `${c} · ${d}` : c || d || "—";
}

export default function ProgramacionMedicaTable(props: {
  data: ProgramacionMedicaPaginated;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: ProgramacionMedica) => void;
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
  onRefresh?: () => void;
  sort?: string | null;
  sortDir?: "asc" | "desc";
  onToggleSort?: (columnId: string) => void;
}) {
  const {
    data,
    loading,
    selectedId,
    onSelect,
    onPrev,
    onNext,
    onFirst,
    onLast,
    onRefresh,
    sort,
    sortDir,
    onToggleSort,
  } = props;

  const columns: DataGridColumnDef<ProgramacionMedica>[] = [
    {
      id: "codigo",
      header: "Código",
      sortable: true,
      align: "center",
      size: 100,
      exportValue: (x) => x.codigo,
      cell: (x) => <span className="tabular-nums">{x.codigo}</span>,
    },
    {
      id: "fecha",
      header: "Fecha",
      sortable: true,
      align: "center",
      size: 120,
      exportValue: (x) => dmyFromYmdString(x.fecha),
      cell: (x) => <span className="tabular-nums">{dmyFromYmdString(x.fecha)}</span>,
    },
    {
      id: "medico",
      header: "Médico",
      align: "left",
      grow: true,
      exportValue: (x) => medicoText(x),
      cell: (x) => <span className="whitespace-normal wrap-anywhere">{medicoText(x)}</span>,
    },
    {
      id: "especialidad",
      header: "Especialidad",
      align: "left",
      grow: true,
      exportValue: (x) => especialidadText(x),
      cell: (x) => <span className="whitespace-normal wrap-anywhere">{especialidadText(x)}</span>,
    },
    {
      id: "consultorio",
      header: "Consultorio",
      align: "left",
      size: 200,
      exportValue: (x) => consultorioText(x),
      cell: (x) => consultorioText(x),
    },
    {
      id: "turno",
      header: "Turno",
      align: "left",
      size: 180,
      exportValue: (x) => turnoText(x),
      cell: (x) => turnoText(x),
    },
    {
      id: "cupos",
      header: "Cupos",
      sortable: true,
      align: "center",
      size: 80,
      exportValue: (x) => String(x.cupos ?? 0),
      cell: (x) => <span className="tabular-nums">{String(x.cupos ?? 0)}</span>,
    },
    {
      id: "estado",
      header: "Estado",
      sortable: true,
      align: "center",
      size: 120,
      exportValue: (x) => x.estado,
      cell: (x) => (
        <div className="flex justify-center">
          <StatusBadge status={x.estado} />
        </div>
      ),
    },
  ];

  return (
    <CrudListGrid
      rows={data.data}
      columns={columns}
      loading={loading}
      meta={data.meta}
      selectedId={selectedId}
      getRowId={(x) => x.id}
      onSelect={onSelect}
      onPrev={onPrev}
      onNext={onNext}
      onFirst={onFirst}
      onLast={onLast}
      onRefresh={onRefresh}
      sort={sort}
      sortDir={sortDir}
      onToggleSort={onToggleSort}
      exportFilename="programacion-medica"
      emptyText="No hay programaciones."
    />
  );
}
