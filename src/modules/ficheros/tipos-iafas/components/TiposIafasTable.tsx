import type { PaginatedResponse, TipoIafa } from "../../types/tiposIafas.types";
import { CrudListGrid } from "../../../../shared/crud/CrudListGrid";
import { ficherosCodigoDescripcionEstadoColumns } from "../../utils/ficherosGridColumns";

export default function TiposIafasTable(props: {
  data: PaginatedResponse<TipoIafa>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: TipoIafa) => void;
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

  const columns = ficherosCodigoDescripcionEstadoColumns<TipoIafa>();

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
      exportFilename="tipos-iafas"
    />
  );
}
