import type { PaginatedResponse, Tarifa } from "../../types/tarifas.types";
import { CrudListGrid } from "../../../../shared/crud/CrudListGrid";
import type { DataGridColumnDef } from "../../../../shared/datagrid";
import { ficherosCodigoColumn, ficherosEstadoColumn, ficherosMainColumn } from "../../utils/ficherosGridColumns";

export default function TarifasTable(props: {
  data: PaginatedResponse<Tarifa>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Tarifa) => void;
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

  const columns: DataGridColumnDef<Tarifa>[] = [
    ficherosCodigoColumn<Tarifa>(),
    ficherosMainColumn<Tarifa>({
      id: "descripcion_tarifa",
      header: "Descripción del tarifario",
      exportValue: (x) => x.descripcion_tarifa,
      cell: (x) => (
        <div className="min-w-0">
          <div className="truncate">{x.descripcion_tarifa || "—"}</div>
          {x.tarifa_base ? <div className="mt-0.5 text-xs text-(--color-text-secondary)">Tarifario base</div> : null}
        </div>
      ),
    }),
    ficherosEstadoColumn<Tarifa>(),
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
      exportFilename="tarifas"
    />
  );
}
