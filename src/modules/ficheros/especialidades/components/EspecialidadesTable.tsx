import type { Especialidad, PaginatedResponse } from "../../types/especialidades.types";
import { CrudListGrid } from "../../../../shared/crud/CrudListGrid";
import { ficherosCodigoDescripcionEstadoColumns } from "../../utils/ficherosGridColumns";

export default function EspecialidadesTable(props: {
  data: PaginatedResponse<Especialidad>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Especialidad) => void;
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

  const columns = ficherosCodigoDescripcionEstadoColumns<Especialidad>();

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
      exportFilename="especialidades"
    />
  );
}
