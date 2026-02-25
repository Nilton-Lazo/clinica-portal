import type { Contratante, PaginatedResponse } from "../../types/contratantes.types";
import { StatusBadge } from "../../components/StatusBadge";
import { DataTable, type DataTableColumn } from "../../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";

export default function ContratantesTable(props: {
  data: PaginatedResponse<Contratante>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Contratante) => void;
  page: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { data, loading, selectedId, onSelect, onPrev, onNext } = props;

  const columns: DataTableColumn<Contratante>[] = [
    {
      key: "codigo",
      header: "Código",
      headerClassName: "text-center w-25",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => x.codigo || "—",
    },
    {
      key: "razon_social",
      header: "Razón social del contratante",
      headerClassName: "text-left",
      cellClassName: "px-3 py-2",
      render: (x) => (
        <div className="min-w-0">
          <div className="truncate">{x.razon_social || "—"}</div>
          <div className="mt-0.5 text-xs text-(--color-text-secondary) truncate">
            {x.ruc ? `RUC ${x.ruc}` : ""}
            {x.ruc && x.telefono ? " · " : ""}
            {x.telefono ? `Tel ${x.telefono}` : ""}
          </div>
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
