import type { Medico, PaginatedResponse } from "../../types/medicos.types";
import { StatusBadge } from "../../components/StatusBadge";
import { DataTable, type DataTableColumn } from "../../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";

function fullName(x: Medico): string {
  const ap = (x.apellido_paterno ?? "").trim();
  const am = (x.apellido_materno ?? "").trim();
  const n = (x.nombres ?? "").trim();
  return `${ap} ${am}, ${n}`.trim();
}

export default function MedicosTable(props: {
  data: PaginatedResponse<Medico>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Medico) => void;
  page: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { data, loading, selectedId, onSelect, onPrev, onNext } = props;

  const columns: DataTableColumn<Medico>[] = [
    {
      key: "cmp",
      header: "CMP",
      headerClassName: "text-center w-25",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => x.cmp ?? "—",
    },
    {
      key: "nombre",
      header: "Apellidos y nombres",
      headerClassName: "text-left",
      cellClassName: "px-3 py-2",
      render: (x) => (
        <div className="min-w-0">
          <div className="truncate">{fullName(x)}</div>
          {x.tipo_profesional_clinica === "EXTERNO" ? (
            <div className="mt-0.5 text-xs text-(--color-text-secondary)">Profesional externo</div>
          ) : null}
        </div>
      ),
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
    <div className="hidden h-full min-h-0 flex-col lg:flex">
      <DataTable
        rows={data.data}
        columns={columns}
        loading={loading}
        selectedId={selectedId}
        getRowId={(x) => x.id}
        onSelect={onSelect}
      />

      <PaginationFooter meta={data.meta} variant="desktop" onPrev={onPrev} onNext={onNext} />
    </div>
  );
}
