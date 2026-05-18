import type { Consultorio, PaginatedResponse } from "../../types/consultorios.types";
import { CrudListGrid } from "../../../../shared/crud/CrudListGrid";
import type { DataGridColumnDef } from "../../../../shared/datagrid";
import { ficherosEstadoColumn, ficherosMainColumn } from "../../utils/ficherosGridColumns";

export default function ConsultoriosTable(props: {
  data: PaginatedResponse<Consultorio>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Consultorio) => void;
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

  const columns: DataGridColumnDef<Consultorio>[] = [
    {
      id: "abreviatura",
      header: "Abreviatura",
      accessor: "abreviatura",
      sortable: true,
      align: "center",
      size: 100,
      exportValue: (x) => x.abreviatura,
    },
    ficherosMainColumn<Consultorio>({
      id: "descripcion",
      header: "Descripción de Consultorio",
      exportValue: (x) => x.descripcion,
      cell: (x) => (
        <div className="min-w-0">
          <div className="truncate">{x.descripcion}</div>
          {x.es_tercero ? (
            <div className="mt-0.5 text-xs text-(--color-text-secondary)">Consultorio de terceros</div>
          ) : null}
        </div>
      ),
    }),
    ficherosEstadoColumn<Consultorio>(),
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
      exportFilename="consultorios"
    />
  );
}
