import type { PaginatedResponse, Turno } from "../../types/turnos.types";
import { StatusBadge } from "../../components/StatusBadge";
import { DataTable, type DataTableColumn } from "../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../shared/crud/PaginationFooter";

function duracionLabel(x: Turno): string {
  const d = (x.duracion_hhmm ?? "").trim();
  if (d) return d;
  const m = Number.isFinite(x.duracion_minutos) ? Math.max(0, Math.trunc(x.duracion_minutos)) : 0;
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export default function TurnosTable(props: {
  data: PaginatedResponse<Turno>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Turno) => void;
  page: number;
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
}) {
  const { data, loading, selectedId, onSelect, onPrev, onNext, onFirst, onLast } = props;

  const columns: DataTableColumn<Turno>[] = [
    {
      key: "codigo",
      header: "Código",
      headerClassName: "text-center w-24",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => x.codigo ?? "—",
    },
    {
      key: "descripcion",
      header: "Descripción",
      headerClassName: "text-left",
      cellClassName: "px-3 py-2 min-w-0",
      render: (x) => x.descripcion ?? "",
    },
    {
      key: "duracion",
      header: "Duración",
      headerClassName: "text-center w-28",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => duracionLabel(x),
    },
    {
      key: "estado",
      header: "Estado",
      headerClassName: "text-center w-44",
      cellClassName: "px-3 py-2 text-center",
      render: (x) => (
        <div className="flex justify-center">
          <StatusBadge status={x.estado} />
        </div>
      ),
    },
  ];

  return (
    <div className="hidden min-h-0 flex-1 flex-col overflow-hidden lg:flex">
      <DataTable
        rows={data.data}
        columns={columns}
        loading={loading}
        selectedId={selectedId}
        getRowId={(x) => x.id}
        onSelect={onSelect}
      />

      <PaginationFooter meta={data.meta} variant="desktop" onPrev={onPrev} onNext={onNext} onFirst={onFirst} onLast={onLast} />
    </div>
  );
}
