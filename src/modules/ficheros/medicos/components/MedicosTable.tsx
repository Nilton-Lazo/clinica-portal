import type { Medico, PaginatedResponse } from "../../types/medicos.types";
import { CrudListGrid } from "../../../../shared/crud/CrudListGrid";
import type { DataGridColumnDef } from "../../../../shared/datagrid";
import { ficherosEstadoColumn, ficherosMainColumn } from "../../utils/ficherosGridColumns";

function fullName(x: Medico): string {
  const ap = (x.apellido_paterno ?? "").trim();
  const am = (x.apellido_materno ?? "").trim();
  const n = (x.nombres ?? "").trim();
  return `${ap} ${am}, ${n}`.trim();
}

export default function MedicosTable(props: {
  data: PaginatedResponse<Medico>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Medico) => void;
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

  const columns: DataGridColumnDef<Medico>[] = [
    {
      id: "cmp",
      header: "CMP",
      sortable: true,
      align: "center",
      size: 100,
      exportValue: (x) => x.cmp ?? "",
      cell: (x) => x.cmp ?? "—",
    },
    ficherosMainColumn<Medico>({
      id: "nombre",
      header: "Apellidos y nombres",
      exportValue: fullName,
      cell: (x) => (
        <div className="min-w-0">
          <div className="truncate">{fullName(x)}</div>
          {x.tipo_profesional_clinica === "EXTERNO" ? (
            <div className="mt-0.5 text-xs text-(--color-text-secondary)">Profesional externo</div>
          ) : null}
        </div>
      ),
    }),
    ficherosEstadoColumn<Medico>(),
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
      exportFilename="medicos"
    />
  );
}
