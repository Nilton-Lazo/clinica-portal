import { StatusBadge } from "../../../components/StatusBadge";
import { DataTable, type DataTableColumn } from "../../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";
import type { MedioPagoCajaItem, MedioPagoCajaListResponse } from "../services/medioPagoCaja.service";

export default function MedioPagoTable(props: {
  data: MedioPagoCajaListResponse;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: MedioPagoCajaItem) => void;
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
}) {
  const { data, loading, selectedId, onSelect, onPrev, onNext, onFirst, onLast } = props;
  const columns: DataTableColumn<MedioPagoCajaItem>[] = [
    {
      key: "codigo",
      header: "Código",
      headerClassName: "text-center w-28",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => x.codigo,
    },
    {
      key: "formas",
      header: "Forma de pago",
      headerClassName: "text-left w-[300px]",
      cellClassName: "px-3 py-2",
      render: (x) => x.forma_pago_labels.join(", "),
    },
    {
      key: "descripcion",
      header: "Descripción",
      headerClassName: "text-left w-[300px]",
      cellClassName: "px-3 py-2",
      render: (x) => x.descripcion,
    },
    {
      key: "estado",
      header: "Estado",
      headerClassName: "text-center w-40",
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
