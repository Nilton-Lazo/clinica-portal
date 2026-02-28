import type { RecargoNocheRegla } from "../../services/recargoNoche.service";
import type { PaginationMeta } from "../../../../shared/types/pagination";
import { StatusBadge } from "../../components/StatusBadge";
import { DataTable, type DataTableColumn } from "../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../shared/crud/PaginationFooter";

export default function RecargoNocheTable(props: {
  reglas: RecargoNocheRegla[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (r: RecargoNocheRegla) => void;
  paginationMeta?: PaginationMeta | null;
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
}) {
  const { reglas, loading, selectedId, onSelect, paginationMeta, onPrev, onNext, onFirst, onLast } = props;

  const columns: DataTableColumn<RecargoNocheRegla>[] = [
    {
      key: "codigo",
      header: "Código",
      headerClassName: "text-center w-20",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (r) => r.categoria_codigo ?? "—",
    },
    {
      key: "categoria",
      header: "Categoría",
      headerClassName: "text-left",
      cellClassName: "px-3 py-2 min-w-0",
      render: (r) => r.categoria_nombre ?? `Categoría ${r.tarifa_categoria_id}`,
    },
    {
      key: "porcentaje",
      header: "%",
      headerClassName: "text-center w-24",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (r) => r.porcentaje,
    },
    {
      key: "hora_desde",
      header: "H. desde",
      headerClassName: "text-center w-28",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (r) => r.hora_desde?.slice(0, 5) ?? "—",
    },
    {
      key: "hora_hasta",
      header: "H. hasta",
      headerClassName: "text-center w-28",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (r) => r.hora_hasta?.slice(0, 5) ?? "—",
    },
    {
      key: "estado",
      header: "Estado",
      headerClassName: "text-center w-28",
      cellClassName: "px-3 py-2 text-center",
      render: (r) => (
        <div className="flex justify-center">
          <StatusBadge status={r.estado} />
        </div>
      ),
    },
  ];

  return (
    <div className="hidden min-h-0 flex-1 flex-col overflow-hidden lg:flex">
      <DataTable
        rows={reglas}
        columns={columns}
        loading={loading}
        selectedId={selectedId}
        getRowId={(r) => r.id}
        onSelect={onSelect}
        emptyText="No hay registros."
      />

      <PaginationFooter
        meta={paginationMeta}
        variant="desktop"
        onPrev={onPrev}
        onNext={onNext}
        onFirst={onFirst}
        onLast={onLast}
      />
    </div>
  );
}
