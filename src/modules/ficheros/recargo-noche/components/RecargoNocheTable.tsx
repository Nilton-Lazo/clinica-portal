import type { RecargoNocheRegla } from "../../services/recargoNoche.service";
import type { PaginationMeta } from "../../../../shared/types/pagination";
import { CrudListGrid } from "../../../../shared/crud/CrudListGrid";
import type { DataGridColumnDef } from "../../../../shared/datagrid";
import { ficherosEstadoColumn } from "../../utils/ficherosGridColumns";

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
  onRefresh?: () => void;
  sort?: string | null;
  sortDir?: "asc" | "desc";
  onToggleSort?: (columnId: string) => void;
}) {
  const {
    reglas,
    loading,
    selectedId,
    onSelect,
    paginationMeta,
    onPrev,
    onNext,
    onFirst,
    onLast,
    onRefresh,
    sort,
    sortDir,
    onToggleSort,
  } = props;

  const columns: DataGridColumnDef<RecargoNocheRegla>[] = [
    {
      id: "codigo",
      header: "Código",
      sortable: true,
      align: "center",
      size: 80,
      exportValue: (r) => r.categoria_codigo ?? "",
      cell: (r) => r.categoria_codigo ?? "—",
    },
    {
      id: "categoria",
      header: "Categoría",
      sortable: true,
      align: "left",
      grow: true,
      exportValue: (r) => r.categoria_nombre ?? "",
      cell: (r) => r.categoria_nombre ?? `Categoría ${r.tarifa_categoria_id}`,
    },
    {
      id: "porcentaje",
      header: "%",
      sortable: true,
      align: "center",
      size: 96,
      exportValue: (r) => String(r.porcentaje),
      cell: (r) => r.porcentaje,
    },
    {
      id: "hora_desde",
      header: "H. desde",
      sortable: true,
      align: "center",
      size: 112,
      exportValue: (r) => r.hora_desde?.slice(0, 5) ?? "",
      cell: (r) => r.hora_desde?.slice(0, 5) ?? "—",
    },
    {
      id: "hora_hasta",
      header: "H. hasta",
      sortable: true,
      align: "center",
      size: 112,
      exportValue: (r) => r.hora_hasta?.slice(0, 5) ?? "",
      cell: (r) => r.hora_hasta?.slice(0, 5) ?? "—",
    },
    ficherosEstadoColumn<RecargoNocheRegla>(),
  ];

  const meta: PaginationMeta = paginationMeta ?? {
    current_page: 1,
    per_page: reglas.length || 50,
    total: reglas.length,
    last_page: 1,
  };

  return (
    <CrudListGrid
      rows={reglas}
      columns={columns}
      loading={loading}
      meta={meta}
      selectedId={selectedId}
      getRowId={(r) => r.id}
      onSelect={onSelect}
      onPrev={onPrev}
      onNext={onNext}
      onFirst={onFirst}
      onLast={onLast}
      onRefresh={onRefresh}
      sort={sort}
      sortDir={sortDir}
      onToggleSort={onToggleSort}
      emptyText="No hay registros."
      exportFilename="recargo-noche"
    />
  );
}
