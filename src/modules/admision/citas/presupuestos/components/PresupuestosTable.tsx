import type { PresupuestoListItem, PresupuestoListaResponse } from "../types/presupuestoLista.types";
import { CrudListGrid } from "../../../../../shared/crud/CrudListGrid";
import type { DataGridColumnDef } from "../../../../../shared/datagrid";
import { EstadoFacturacionBadge } from "../../agenda/components/EstadoFacturacionBadge";

function formatDMY(iso?: string | null): string {
  if (!iso) return "—";
  const s = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

export default function PresupuestosTable(props: {
  data: PresupuestoListaResponse;
  loading: boolean;
  onOpenRow: (id: number) => void;
  onPrefetchRow?: (id: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onFirst: () => void;
  onLast: () => void;
  onRefresh?: () => void;
  sort?: string | null;
  sortDir?: "asc" | "desc";
  onToggleSort?: (columnId: string) => void;
}) {
  const {
    data,
    loading,
    onOpenRow,
    onPrefetchRow,
    onPrev,
    onNext,
    onFirst,
    onLast,
    onRefresh,
    sort,
    sortDir,
    onToggleSort,
  } = props;

  const columns: DataGridColumnDef<PresupuestoListItem>[] = [
    {
      id: "codigo",
      header: "Código",
      sortable: true,
      align: "center",
      size: 120,
      exportValue: (x) => x.codigo ?? "",
      cell: (x) => <span className="tabular-nums">{x.codigo?.trim() ? x.codigo : "—"}</span>,
    },
    {
      id: "hc",
      header: "N° Historia",
      sortable: true,
      align: "center",
      size: 130,
      exportValue: (x) => x.hc ?? "",
      cell: (x) => <span className="tabular-nums">{x.hc?.trim() ? x.hc : "—"}</span>,
    },
    {
      id: "nr",
      header: "N° Referencia",
      align: "center",
      size: 130,
      exportValue: (x) => (x.nr ? String(x.nr) : ""),
      cell: (x) => <span className="tabular-nums">{x.nr ? x.nr : "—"}</span>,
    },
    {
      id: "nombre_completo",
      header: "Apellidos y nombres",
      sortable: true,
      align: "left",
      grow: true,
      exportValue: (x) => x.nombre_completo ?? "",
      cell: (x) => (
        <span className="whitespace-normal wrap-anywhere">{x.nombre_completo?.trim() ? x.nombre_completo : "—"}</span>
      ),
    },
    {
      id: "plan",
      header: "Plan",
      align: "center",
      size: 150,
      exportValue: (x) => x.plan ?? "",
      cell: (x) => (x.plan?.trim() ? x.plan : "—"),
    },
    {
      id: "vigencia_hasta",
      header: "Vencimiento",
      sortable: true,
      align: "center",
      size: 130,
      exportValue: (x) => formatDMY(x.vigencia_hasta),
      cell: (x) => <span className="tabular-nums">{formatDMY(x.vigencia_hasta)}</span>,
    },
    {
      id: "estado",
      header: "Estado",
      sortable: true,
      align: "center",
      size: 140,
      exportValue: (x) => x.estado,
      cell: (x) => (
        <div className="flex justify-center">
          <EstadoFacturacionBadge estado={x.estado} mode="presupuesto" />
        </div>
      ),
    },
  ];

  return (
    <CrudListGrid
      rows={data.data}
      columns={columns}
      loading={loading}
      meta={data.meta}
      selectedId={null}
      getRowId={(x) => x.id}
      onSelect={(row) => onOpenRow(row.id)}
      onRowPointerEnter={onPrefetchRow ? (row) => onPrefetchRow(row.id) : undefined}
      onPrev={onPrev}
      onNext={onNext}
      onFirst={onFirst}
      onLast={onLast}
      onRefresh={onRefresh}
      sort={sort}
      sortDir={sortDir}
      onToggleSort={onToggleSort}
      exportFilename="presupuestos-admision"
    />
  );
}
