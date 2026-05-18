import type { PaginatedResponse, Turno } from "../../types/turnos.types";
import { CrudListGrid } from "../../../../shared/crud/CrudListGrid";
import type { DataGridColumnDef } from "../../../../shared/datagrid";
import {
  ficherosCodigoColumn,
  ficherosDescripcionColumn,
  ficherosEstadoColumn,
} from "../../utils/ficherosGridColumns";

function duracionLabel(x: Turno): string {
  const d = (x.duracion_hhmm ?? "").trim();
  if (d) return d;
  const m = Number.isFinite(x.duracion_minutos) ? Math.max(0, Math.trunc(x.duracion_minutos)) : 0;
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export default function TurnosTable(props: {
  data: PaginatedResponse<Turno>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Turno) => void;
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
  } = props;

  const columns: DataGridColumnDef<Turno>[] = [
    ficherosCodigoColumn<Turno>(),
    ficherosDescripcionColumn<Turno>(),
    {
      id: "duracion",
      header: "Duración",
      sortable: true,
      align: "center",
      size: 112,
      exportValue: duracionLabel,
      cell: (x) => duracionLabel(x),
    },
    ficherosEstadoColumn<Turno>(),
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
      onRefresh={onRefresh}
      sort={sort}
      sortDir={sortDir}
      onToggleSort={onToggleSort}
      exportFilename="turnos"
    />
  );
}
