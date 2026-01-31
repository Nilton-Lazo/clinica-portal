import type { AcreditacionPlan, ContratanteLookup, IafaLookup, PaginatedResponse, RecordStatus } from "../acreditacionPlanes.types";
import { DataTable, type DataTableColumn } from "../../../../../shared/crud/DataTable";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";
import { StatusBadge } from "../../../ficheros/components/StatusBadge";

function planLabel(p: AcreditacionPlan): string {
  const c = (p.tipo_cliente?.codigo ?? "").trim();
  const d = (p.tipo_cliente?.descripcion_tipo_cliente ?? "").trim();
  return c && d ? `${c} · ${d}` : c || d || `#${p.id}`;
}

function parentescoLabel(v: string | null): string {
  const s = (v ?? "").toUpperCase();
  if (s === "NO_DEFINIDO") return "No definido";
  if (s === "TITULAR") return "Titular";
  if (s === "CONYUGE") return "Cónyuge";
  if (s === "HIJO") return "Hijo";
  if (s === "HIJA") return "Hija";
  if (s === "HERMANO") return "Hermano";
  if (s === "HERMANA") return "Hermana";
  if (s === "HIJO_INCAPACITADO") return "Hijo incapacitado";
  if (s === "PADRE") return "Padre";
  if (s === "MADRE") return "Madre";
  if (s === "OTRO") return "Otro";
  return v ? v : "—";
}

function iafaLabel(p: AcreditacionPlan, iafaById: Record<number, IafaLookup>): string {
  const id = p.tipo_cliente?.iafa_id ?? null;
  if (!id) return "—";
  const x = iafaById[id];
  if (!x) return `#${id}`;
  const dc = x.descripcion_corta?.trim();
  if (dc) return dc;
  const rs = x.razon_social?.trim();
  return rs || x.codigo?.trim() || `#${id}`;
}

function contratanteLabel(p: AcreditacionPlan, contratanteById: Record<number, ContratanteLookup>): string {
  const id = p.tipo_cliente?.contratante_id ?? null;
  if (!id) return "—";
  const x = contratanteById[id];
  if (!x) return `#${id}`;
  const rs = x.razon_social?.trim();
  return rs || x.codigo?.trim() || `#${id}`;
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
  iafaById: Record<number, IafaLookup>;
  contratanteById: Record<number, ContratanteLookup>;
}) {
  const { data, loading, selectedId, onSelect, onPrev, onNext, emptyText, iafaById, contratanteById } = props;

  const columns: DataTableColumn<AcreditacionPlan>[] = [
    {
      key: "tipo_cliente",
      header: "Tipo de cliente",
      headerClassName: "text-left",
      cellClassName: "px-3 py-2",
      render: (p) => (
        <div className="min-w-0">
          <div className="truncate">{planLabel(p)}</div>
        </div>
      ),
    },
    {
      key: "iafa",
      header: "IAFAS",
      headerClassName: "text-left",
      cellClassName: "px-3 py-2",
      render: (p) => (
        <div className="min-w-0">
          <div className="truncate">{iafaLabel(p, iafaById)}</div>
        </div>
      ),
    },
    {
      key: "contratante",
      header: "Contratante",
      headerClassName: "text-left",
      cellClassName: "px-3 py-2",
      render: (p) => (
        <div className="min-w-0">
          <div className="truncate">{contratanteLabel(p, contratanteById)}</div>
        </div>
      ),
    },
    {
      key: "condicion",
      header: "Condición",
      headerClassName: "text-left w-44",
      cellClassName: "px-3 py-2",
      render: (p) => parentescoLabel(p.parentesco_seguro),
    },
    {
      key: "estado",
      header: "Estado",
      headerClassName: "text-center w-32",
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
