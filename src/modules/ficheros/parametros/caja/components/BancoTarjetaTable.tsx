import { StatusBadge } from "../../../components/StatusBadge";
import { DataTable, type DataTableColumn } from "../../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";
import type { BancoTarjetaCajaItem, BancoTarjetaCajaListResponse } from "../services/bancoTarjetaCaja.service";

export default function BancoTarjetaTable(props: {
  data: BancoTarjetaCajaListResponse;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: BancoTarjetaCajaItem) => void;
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
}) {
  const { data, loading, selectedId, onSelect, onPrev, onNext, onFirst, onLast } = props;

  const columns: DataTableColumn<BancoTarjetaCajaItem>[] = [
    {
      key: "codigo",
      header: "Código",
      headerClassName: "text-center w-24 shrink-0",
      cellClassName: "px-3 py-2 text-center tabular-nums align-middle whitespace-nowrap w-24 max-w-24",
      render: (x) => x.codigo || "—",
    },
    {
      key: "descripcion",
      header: "Banco o tarjeta",
      headerClassName: "text-left min-w-0 w-[50%]",
      cellClassName: "px-3 py-2 align-top min-w-0",
      render: (x) => {
        const secondary = (x.resumen_secundario ?? "").trim() || "—";
        return (
          <div className="min-w-0 wrap-anywhere">
            <div className="whitespace-normal font-medium text-(--color-text-primary)">{x.descripcion || "—"}</div>
            <div className="mt-0.5 whitespace-normal text-xs text-(--color-text-secondary) wrap-anywhere">{secondary}</div>
          </div>
        );
      },
    },
    {
      key: "estado",
      header: "Estado",
      headerClassName: "text-center w-44 shrink-0",
      cellClassName: "px-3 py-2 text-center align-middle whitespace-nowrap w-44",
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
        tableClassName="table-fixed w-full max-w-full"
      />
      <PaginationFooter meta={data.meta} variant="desktop" onPrev={onPrev} onNext={onNext} onFirst={onFirst} onLast={onLast} />
    </div>
  );
}
