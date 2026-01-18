import type { ProgramacionMedica, ProgramacionMedicaPaginated } from "../types/programacionMedica.types";
import { DataTable, type DataTableColumn } from "../../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";
import { StatusBadge } from "../../../ficheros/components/StatusBadge";
import { dmyFromYmdString } from "../utils/programacionMedica.utils";

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
}) {
  const { data, loading, selectedId, onSelect, onPrev, onNext } = props;

  const columns: DataTableColumn<ProgramacionMedica>[] = [
    {
      key: "codigo",
      header: "Código",
      headerClassName: "text-center w-28",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => x.codigo,
    },
    {
      key: "fecha",
      header: "Fecha",
      headerClassName: "text-center w-36",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => dmyFromYmdString(x.fecha),
    },
    {
      key: "medico",
      header: "Médico",
      headerClassName: "text-center",
      cellClassName: "px-3 py-2",
      render: (x) => medicoText(x),
    },
    {
      key: "especialidad",
      header: "Especialidad",
      headerClassName: "text-center",
      cellClassName: "px-3 py-2",
      render: (x) => especialidadText(x),
    },
    {
      key: "consultorio",
      header: "Consultorio",
      headerClassName: "text-center w-64",
      cellClassName: "px-3 py-2",
      render: (x) => consultorioText(x),
    },
    {
      key: "turno",
      header: "Turno",
      headerClassName: "text-center w-72",
      cellClassName: "px-3 py-2",
      render: (x) => turnoText(x),
    },
    {
      key: "cupos",
      header: "Cupos",
      headerClassName: "text-center w-24",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => String(x.cupos ?? 0),
    },
    {
      key: "estado",
      header: "Estado",
      headerClassName: "text-center w-28",
      cellClassName: "px-3 py-2 text-center",
      render: (x) => (
        <div className="flex justify-center">
          <StatusBadge status={x.estado} />
        </div>
      ),
    },
  ];

  return (
    <div className="hidden h-full min-h-0 flex-col lg:flex">
      <DataTable
        rows={data.data}
        columns={columns}
        loading={loading}
        selectedId={selectedId}
        getRowId={(x) => x.id}
        onSelect={onSelect}
        emptyText="No hay programaciones."
      />
      <PaginationFooter meta={data.meta} variant="desktop" onPrev={onPrev} onNext={onNext} />
    </div>
  );
}
