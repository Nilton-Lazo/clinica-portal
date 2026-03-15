import type { ParamOption, PaginatedResponse } from "../types/paramOption.types";
import { StatusBadge } from "../../../components/StatusBadge";
import { DataTable, type DataTableColumn } from "../../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";

export default function ParamOptionTable(props: {
  data: PaginatedResponse<ParamOption>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: ParamOption) => void;
  page: number;
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
}) {
  const { data, loading, selectedId, onSelect, onPrev, onNext, onFirst, onLast } = props;
  const columns: DataTableColumn<ParamOption>[] = [
    {
      key: "codigo",
      header: "Código",
      headerClassName: "text-center w-28",
      cellClassName: "px-3 py-2 text-center",
      render: (x) => x.codigo,
    },
    {
      key: "descripcion",
      header: "Descripción",
      headerClassName: "text-left",
      cellClassName: "px-3 py-2",
      render: (x) => x.descripcion,
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
