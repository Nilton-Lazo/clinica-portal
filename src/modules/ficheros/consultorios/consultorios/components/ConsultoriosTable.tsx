import type { Consultorio, PaginatedResponse } from "../../types/consultorios.types";
import { StatusBadge } from "../../components/StatusBadge";
import { DataTable, type DataTableColumn } from "../../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";

export default function ConsultoriosTable(props: {
  data: PaginatedResponse<Consultorio>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Consultorio) => void;
  page: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { data, loading, selectedId, onSelect, onPrev, onNext } = props;

  const columns: DataTableColumn<Consultorio>[] = [
    {
      key: "abreviatura",
      header: "Abreviatura",
      headerClassName: "text-center w-40",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => x.abreviatura,
    },
    {
      key: "descripcion",
      header: "Descripción de Consultorio",
      headerClassName: "text-left",
      cellClassName: "px-3 py-2",
      render: (x) => (
        <div className="min-w-0">
          <div className="truncate">{x.descripcion}</div>
          {x.es_tercero ? (
            <div className="mt-0.5 text-xs text-(--color-text-secondary)">Consultorio de terceros</div>
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
