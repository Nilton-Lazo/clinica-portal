import { CrudListGrid } from "../../../../../shared/crud/CrudListGrid";
import type { DataGridColumnDef } from "../../../../../shared/datagrid";
import { ficherosEstadoColumn } from "../../../utils/ficherosGridColumns";
import type {
  NumeracionComprobanteCajaItem,
  NumeracionComprobanteCajaListResponse,
} from "../services/numeracionComprobanteCaja.service";

export default function NumeracionComprobanteTable(props: {
  data: NumeracionComprobanteCajaListResponse;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: NumeracionComprobanteCajaItem) => void;
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

  const columns: DataGridColumnDef<NumeracionComprobanteCajaItem>[] = [
    {
      id: "tipo_documento_descripcion",
      header: "Tipo documento",
      sortable: true,
      align: "left",
      grow: true,
      exportValue: (x) => `${x.tipo_documento_codigo} · ${x.tipo_documento_descripcion}`,
      cell: (x) => `${x.tipo_documento_codigo} · ${x.tipo_documento_descripcion}`,
    },
    {
      id: "serie",
      header: "Serie",
      sortable: true,
      align: "center",
      size: 112,
      exportValue: (x) => x.serie,
      cell: (x) => x.serie,
    },
    {
      id: "numero_formateado",
      header: "Número",
      sortable: true,
      align: "center",
      size: 112,
      exportValue: (x) => x.numero_formateado,
      cell: (x) => x.numero_formateado,
    },
    ficherosEstadoColumn<NumeracionComprobanteCajaItem>(),
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
      exportFilename="numeracion-comprobante-caja"
    />
  );
}
