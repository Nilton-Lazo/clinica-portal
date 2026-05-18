import type { Iafa, PaginatedResponse } from "../../types/iafas.types";
import { CrudListGrid } from "../../../../shared/crud/CrudListGrid";
import type { DataGridColumnDef } from "../../../../shared/datagrid";
import { ficherosCodigoColumn, ficherosEstadoColumn, ficherosMainColumn } from "../../utils/ficherosGridColumns";

export default function IafasTable(props: {
  data: PaginatedResponse<Iafa>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Iafa) => void;
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

  const columns: DataGridColumnDef<Iafa>[] = [
    ficherosCodigoColumn<Iafa>(),
    ficherosMainColumn<Iafa>({
      id: "razon_social",
      header: "Razón social IAFAS",
      exportValue: (x) => x.razon_social,
      cell: (x) => (
        <div className="min-w-0">
          <div className="truncate">{x.razon_social || "—"}</div>
          <div className="mt-0.5 truncate text-xs text-(--color-text-secondary)">
            {x.descripcion_corta ? `${x.descripcion_corta} · ` : ""}
            {x.ruc ? `RUC ${x.ruc}` : ""}
          </div>
        </div>
      ),
    }),
    ficherosEstadoColumn<Iafa>(),
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
      exportFilename="iafas"
    />
  );
}
