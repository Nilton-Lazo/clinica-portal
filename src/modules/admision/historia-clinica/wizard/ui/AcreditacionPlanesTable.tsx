import type { AcreditacionPlan, ContratanteLookup, IafaLookup, PaginatedResponse, RecordStatus } from "../acreditacionPlanes.types";
import { CrudListGrid } from "../../../../../shared/crud/CrudListGrid";
import type { DataGridColumnDef } from "../../../../../shared/datagrid";
import { GridCellText } from "../../../../../shared/datagrid";
import { StatusBadge } from "../../../../ficheros/components/StatusBadge";

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
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
  emptyText?: string;
  iafaById: Record<number, IafaLookup>;
  contratanteById: Record<number, ContratanteLookup>;
  heightMode?: "fill" | "hug";
}) {
  const {
    data,
    loading,
    selectedId,
    onSelect,
    onPrev,
    onNext,
    onFirst,
    onLast,
    emptyText,
    iafaById,
    contratanteById,
    heightMode = "fill",
  } = props;

  const columns: DataGridColumnDef<AcreditacionPlan>[] = [
    {
      id: "tipo_cliente",
      header: "Tipo de cliente",
      align: "left",
      grow: true,
      minSize: 160,
      sortable: true,
      exportValue: (p) => planLabel(p),
      cell: (p) => <GridCellText value={planLabel(p)} title={planLabel(p)} />,
    },
    {
      id: "iafa",
      header: "IAFAS",
      align: "left",
      size: 180,
      sortable: true,
      exportValue: (p) => iafaLabel(p, iafaById),
      cell: (p) => {
        const label = iafaLabel(p, iafaById);
        return <GridCellText value={label} title={label !== "—" ? label : undefined} />;
      },
    },
    {
      id: "contratante",
      header: "Contratante",
      align: "left",
      size: 200,
      sortable: true,
      exportValue: (p) => contratanteLabel(p, contratanteById),
      cell: (p) => {
        const label = contratanteLabel(p, contratanteById);
        return <GridCellText value={label} title={label !== "—" ? label : undefined} />;
      },
    },
    {
      id: "condicion",
      header: "Condición",
      align: "left",
      size: 150,
      sortable: true,
      exportValue: (p) => parentescoLabel(p.parentesco_seguro),
      cell: (p) => parentescoLabel(p.parentesco_seguro),
    },
    {
      id: "estado",
      header: "Estado",
      align: "center",
      size: 120,
      sortable: true,
      exportValue: (p) => p.estado,
      cell: (p) => (
        <div className="flex justify-center">
          <StatusBadge status={p.estado as RecordStatus} />
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
      selectedId={selectedId}
      getRowId={(x) => x.id}
      onSelect={onSelect}
      onPrev={onPrev}
      onNext={onNext}
      onFirst={onFirst}
      onLast={onLast}
      emptyText={emptyText}
      heightMode={heightMode}
      enableExport={false}
      enableColumnPicker={false}
    />
  );
}
