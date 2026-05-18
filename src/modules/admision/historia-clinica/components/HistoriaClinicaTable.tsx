import type { PacienteListItem, PaginatedResponse } from "../types/historiaClinica.types";
import { CrudListGrid } from "../../../../shared/crud/CrudListGrid";
import type { DataGridColumnDef } from "../../../../shared/datagrid";
import { StatusBadge } from "../../../ficheros/components/StatusBadge";

function formatDMY(iso?: string | null): string {
  if (!iso) return "—";
  const s = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "—";
  const [y, m, d] = s.split("-");
  return `${d}-${m}-${y}`;
}

function labelize(v?: string | null): string {
  if (!v) return "—";
  const x = v.replace(/_/g, " ").toLowerCase();
  return x.charAt(0).toUpperCase() + x.slice(1);
}

export default function HistoriaClinicaTable(props: {
  data: PaginatedResponse<PacienteListItem>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: PacienteListItem) => void;
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
  onRefresh?: () => void;
  sort?: string | null;
  sortDir?: "asc" | "desc";
  onToggleSort?: (columnId: string) => void;
  pickerMode?: boolean;
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
    onRefresh,
    sort,
    sortDir,
    onToggleSort,
    pickerMode,
  } = props;

  const columnsFull: DataGridColumnDef<PacienteListItem>[] = [
    {
      id: "hc",
      header: "N° Historia",
      sortable: true,
      align: "center",
      size: 140,
      exportValue: (x) => x.hc || "",
      cell: (x) => <span className="tabular-nums">{x.hc || "—"}</span>,
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
      id: "condicion",
      header: "Condición",
      align: "center",
      size: 150,
      exportValue: (x) => labelize(x.parentesco_seguro),
      cell: (x) => labelize(x.parentesco_seguro),
    },
    {
      id: "nr",
      header: "N° Referencia",
      sortable: true,
      align: "center",
      size: 130,
      exportValue: (x) => (x.nr ? String(x.nr) : ""),
      cell: (x) => <span className="tabular-nums">{x.nr ? x.nr : "—"}</span>,
    },
    {
      id: "sexo",
      header: "Sexo",
      sortable: true,
      align: "center",
      size: 100,
      exportValue: (x) => labelize(x.sexo),
      cell: (x) => labelize(x.sexo),
    },
    {
      id: "fecha_nacimiento",
      header: "F. nacimiento",
      sortable: true,
      align: "center",
      size: 130,
      exportValue: (x) => formatDMY(x.fecha_nacimiento),
      cell: (x) => <span className="tabular-nums">{formatDMY(x.fecha_nacimiento)}</span>,
    },
    {
      id: "created_at",
      header: "F. filiación",
      sortable: true,
      align: "center",
      size: 130,
      exportValue: (x) => formatDMY(x.created_at),
      cell: (x) => <span className="tabular-nums">{formatDMY(x.created_at)}</span>,
    },
    {
      id: "updated_at",
      header: "F. actualización",
      sortable: true,
      align: "center",
      size: 140,
      exportValue: (x) => formatDMY(x.updated_at),
      cell: (x) => <span className="tabular-nums">{formatDMY(x.updated_at)}</span>,
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
          <StatusBadge status={x.estado} />
        </div>
      ),
    },
  ];

  const columnsPicker: DataGridColumnDef<PacienteListItem>[] = [
    {
      id: "hc",
      header: "N° Historia",
      sortable: true,
      align: "center",
      size: 130,
      cell: (x) => <span className="tabular-nums">{x.hc || "—"}</span>,
    },
    {
      id: "nombre_completo",
      header: "Apellidos y Nombres",
      sortable: true,
      align: "left",
      grow: true,
      cell: (x) => (
        <span className="whitespace-normal wrap-anywhere">{x.nombre_completo?.trim() ? x.nombre_completo : "—"}</span>
      ),
    },
    {
      id: "condicion",
      header: "Condición",
      align: "center",
      size: 130,
      cell: (x) => labelize(x.parentesco_seguro),
    },
    {
      id: "estado",
      header: "Estado",
      sortable: true,
      align: "center",
      size: 120,
      cell: (x) => (
        <div className="flex justify-center">
          <StatusBadge status={x.estado} />
        </div>
      ),
    },
  ];

  const columns = pickerMode ? columnsPicker : columnsFull;

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
      onRefresh={onRefresh}
      sort={sort}
      sortDir={sortDir}
      onToggleSort={onToggleSort}
      exportFilename={pickerMode ? undefined : "historias-clinicas"}
      enableExport={!pickerMode}
    />
  );
}
