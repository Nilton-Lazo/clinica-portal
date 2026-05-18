import type { ParamOption, PaginatedResponse } from "../types/paramOption.types";
import { CrudListGrid } from "../../../../../shared/crud/CrudListGrid";
import { ficherosCodigoDescripcionEstadoColumns } from "../../../utils/ficherosGridColumns";

export default function ParamOptionTable(props: {
  data: PaginatedResponse<ParamOption>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: ParamOption) => void;
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

  const columns = ficherosCodigoDescripcionEstadoColumns<ParamOption>();

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
      exportFilename="parametros"
    />
  );
}
