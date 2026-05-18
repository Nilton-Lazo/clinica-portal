import { CrudListGrid } from "../../../../../shared/crud/CrudListGrid";
import type { DataGridColumnDef } from "../../../../../shared/datagrid";
import {
  ficherosCodigoColumn,
  ficherosDescripcionColumn,
  ficherosEstadoColumn,
} from "../../../utils/ficherosGridColumns";
import type { MedioPagoCajaItem, MedioPagoCajaListResponse } from "../services/medioPagoCaja.service";

export default function MedioPagoTable(props: {
  data: MedioPagoCajaListResponse;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: MedioPagoCajaItem) => void;
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

  const columns: DataGridColumnDef<MedioPagoCajaItem>[] = [
    ficherosCodigoColumn<MedioPagoCajaItem>(),
    {
      id: "formas",
      header: "Forma de pago",
      sortable: true,
      align: "left",
      size: 300,
      exportValue: (x) => x.forma_pago_labels.join(", "),
      cell: (x) => x.forma_pago_labels.join(", "),
    },
    ficherosDescripcionColumn<MedioPagoCajaItem>(),
    ficherosEstadoColumn<MedioPagoCajaItem>(),
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
      exportFilename="medios-pago-caja"
    />
  );
}
