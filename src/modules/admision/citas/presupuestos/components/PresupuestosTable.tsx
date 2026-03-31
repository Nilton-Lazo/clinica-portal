import type { PresupuestoListItem, PresupuestoListaResponse } from "../types/presupuestoLista.types";
import { DataTable, type DataTableColumn } from "../../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";
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
}) {
  const { data, loading, onOpenRow, onPrefetchRow, onPrev, onNext, onFirst, onLast } = props;

  const columns: DataTableColumn<PresupuestoListItem>[] = [
    {
      key: "codigo",
      header: "Código",
      headerClassName: "text-center w-36",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => (x.codigo?.trim() ? x.codigo : "—"),
    },
    {
      key: "hc",
      header: "N° Historia",
      headerClassName: "text-center w-40",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => (x.hc?.trim() ? x.hc : "—"),
    },
    {
      key: "nr",
      header: "N° Referencia",
      headerClassName: "text-center w-40",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => (x.nr ? x.nr : "—"),
    },
    {
      key: "nombre_completo",
      header: "Apellidos y nombres",
      headerClassName: "text-left min-w-[260px]",
      cellClassName: "px-3 py-2",
      render: (x) => (x.nombre_completo?.trim() ? x.nombre_completo : "—"),
    },
    {
      key: "plan",
      header: "Plan",
      headerClassName: "text-center min-w-[140px]",
      cellClassName: "px-3 py-2 text-center",
      render: (x) => (x.plan?.trim() ? x.plan : "—"),
    },
    {
      key: "vigencia_hasta",
      header: "Vencimiento",
      headerClassName: "text-center w-44",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (x) => formatDMY(x.vigencia_hasta),
    },
    {
      key: "estado",
      header: "Estado",
      headerClassName: "text-center w-44",
      cellClassName: "px-3 py-2 text-center",
      render: (x) => (
        <div className="flex justify-center">
          <EstadoFacturacionBadge estado={x.estado} mode="presupuesto" />
        </div>
      ),
    },
  ];

  return (
    <div className="hidden min-h-0 flex-1 flex-col lg:flex">
      <DataTable
        rows={data.data}
        columns={columns}
        loading={loading}
        selectedId={null}
        getRowId={(x) => x.id}
        onSelect={(row) => onOpenRow(row.id)}
        onRowPointerEnter={onPrefetchRow ? (row) => onPrefetchRow(row.id) : undefined}
      />
      <PaginationFooter meta={data.meta} variant="desktop" onPrev={onPrev} onNext={onNext} onFirst={onFirst} onLast={onLast} />
    </div>
  );
}
