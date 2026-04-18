import { StatusBadge } from "../../../components/StatusBadge";
import { DataTable, type DataTableColumn } from "../../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";
import type { NumeracionComprobanteCajaItem, NumeracionComprobanteCajaListResponse } from "../services/numeracionComprobanteCaja.service";

export default function NumeracionComprobanteTable(props: {
  data: NumeracionComprobanteCajaListResponse;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: NumeracionComprobanteCajaItem) => void;
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
}) {
  const { data, loading, selectedId, onSelect, onPrev, onNext, onFirst, onLast } = props;
  const columns: DataTableColumn<NumeracionComprobanteCajaItem>[] = [
    {
      key: "tipo_documento_descripcion",
      header: "Tipo documento",
      headerClassName: "text-left",
      cellClassName: "px-3 py-2",
      render: (x) => `${x.tipo_documento_codigo} · ${x.tipo_documento_descripcion}`,
    },
    {
      key: "serie",
      header: "Serie",
      headerClassName: "text-center w-28",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => x.serie,
    },
    {
      key: "numero_formateado",
      header: "Número",
      headerClassName: "text-center w-28",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => x.numero_formateado,
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
