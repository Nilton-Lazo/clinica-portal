import type { PaginatedResponse, TipoCliente } from "../../types/tiposClientes.types";
import { StatusBadge } from "../../components/StatusBadge";
import { DataTable, type DataTableColumn } from "../../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";

export default function TiposClientesTable(props: {
  data: PaginatedResponse<TipoCliente>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: TipoCliente) => void;
  page: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { data, loading, selectedId, onSelect, onPrev, onNext } = props;

  const columns: DataTableColumn<TipoCliente>[] = [
    {
      key: "codigo",
      header: "Código",
      headerClassName: "text-center w-25",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => x.codigo || "—",
    },
    {
      key: "descripcion_tipo_cliente",
      header: "Tipo de cliente",
      headerClassName: "text-left",
      cellClassName: "px-3 py-2",
      render: (x) => <div className="min-w-0 truncate">{x.descripcion_tipo_cliente || "—"}</div>,
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
