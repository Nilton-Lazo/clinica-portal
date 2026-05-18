import type { Contratante, PaginatedResponse } from "../../types/contratantes.types";
import { CrudListGrid } from "../../../../shared/crud/CrudListGrid";
import type { DataGridColumnDef } from "../../../../shared/datagrid";
import { ficherosCodigoColumn, ficherosEstadoColumn, ficherosMainColumn } from "../../utils/ficherosGridColumns";

export default function ContratantesTable(props: {
  data: PaginatedResponse<Contratante>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Contratante) => void;
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

  const columns: DataGridColumnDef<Contratante>[] = [
    ficherosCodigoColumn<Contratante>(),
    ficherosMainColumn<Contratante>({
      id: "razon_social",
      header: "Razón social del contratante",
      exportValue: (x) => x.razon_social,
      cell: (x) => (
        <div className="min-w-0">
          <div className="truncate">{x.razon_social || "—"}</div>
          <div className="mt-0.5 truncate text-xs text-(--color-text-secondary)">
            {x.ruc ? `RUC ${x.ruc}` : ""}
            {x.ruc && x.telefono ? " · " : ""}
            {x.telefono ? `Tel ${x.telefono}` : ""}
          </div>
        </div>
      ),
    }),
    ficherosEstadoColumn<Contratante>(),
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
      exportFilename="contratantes"
    />
  );
}
