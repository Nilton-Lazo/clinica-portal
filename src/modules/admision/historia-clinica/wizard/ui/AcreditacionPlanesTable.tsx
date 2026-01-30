import type { AcreditacionPlan, PaginatedResponse, RecordStatus } from "../acreditacionPlanes.types";
import { DataTable, type DataTableColumn } from "../../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";
import { StatusBadge } from "../../../ficheros/components/StatusBadge";

function planLabel(p: AcreditacionPlan): string {
  const c = (p.tipo_cliente?.codigo ?? "").trim();
  const d = (p.tipo_cliente?.descripcion_tipo_cliente ?? "").trim();
  return c && d ? `${c} · ${d}` : c || d || `#${p.id}`;
}

function formatDateForDisplay(iso: string | null): string {
  const t = (iso ?? "").trim();
  if (!t) return "—";
  if (!/^\d{4}-\d{2}-\d{2}/.test(t)) return t;
  const y = t.slice(0, 4);
  const m = t.slice(5, 7);
  const d = t.slice(8, 10);
  return `${d}/${m}/${y}`;
}

function parentescoLabel(v: string | null): string {
  const s = (v ?? "").toUpperCase();
  if (s === "TITULAR") return "Titular";
  if (s === "CONYUGE") return "Cónyuge";
  if (s === "HIJO") return "Hijo";
  if (s === "PADRE") return "Padre";
  if (s === "MADRE") return "Madre";
  if (s === "OTRO") return "Otro";
  return v ? v : "—";
}

export default function AcreditacionPlanesTable(props: {
  data: PaginatedResponse<AcreditacionPlan>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: AcreditacionPlan) => void;
  page: number;
  onPrev: () => void;
  onNext: () => void;
  emptyText?: string;
}) {
  const { data, loading, selectedId, onSelect, onPrev, onNext, emptyText } = props;

  const columns: DataTableColumn<AcreditacionPlan>[] = [
    {
      key: "plan",
      header: "Plan",
      headerClassName: "text-left",
      cellClassName: "px-3 py-2",
      render: (p) => (
        <div className="min-w-0">
          <div className="truncate">{planLabel(p)}</div>
        </div>
      ),
    },
    {
      key: "parentesco",
      header: "Parentesco",
      headerClassName: "text-left w-44",
      cellClassName: "px-3 py-2",
      render: (p) => parentescoLabel(p.parentesco_seguro),
    },
    {
      key: "afiliacion",
      header: "Afiliación",
      headerClassName: "text-center w-44",
      cellClassName: "px-3 py-2 text-center tabular-nums",
      render: (p) => formatDateForDisplay(p.fecha_afiliacion),
    },
    {
      key: "estado",
      header: "Estado",
      headerClassName: "text-center w-44",
      cellClassName: "px-3 py-2 text-center",
      render: (p) => (
        <div className="flex justify-center">
          <StatusBadge status={p.estado as RecordStatus} />
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
        emptyText={emptyText}
      />

      <PaginationFooter meta={data.meta} variant="desktop" onPrev={onPrev} onNext={onNext} />
    </div>
  );
}
