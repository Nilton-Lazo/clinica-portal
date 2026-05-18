import type { PaginatedResponse, TipoCliente } from "../../types/tiposClientes.types";
import { CrudListGrid } from "../../../../shared/crud/CrudListGrid";
import type { DataGridColumnDef } from "../../../../shared/datagrid";
import {
  ficherosCodigoColumn,
  ficherosEstadoColumn,
} from "../../utils/ficherosGridColumns";

export default function TiposClientesTable(props: {
  data: PaginatedResponse<TipoCliente>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: TipoCliente) => void;
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

  const columns: DataGridColumnDef<TipoCliente>[] = [
    ficherosCodigoColumn<TipoCliente>(),
    {
      id: "descripcion_tipo_cliente",
      header: "Tipo de cliente",
      accessor: "descripcion_tipo_cliente",
      sortable: true,
      align: "left",
      grow: true,
      exportValue: (x) => x.descripcion_tipo_cliente,
    },
    ficherosEstadoColumn<TipoCliente>(),
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
      exportFilename="tipos-clientes"
    />
  );
}
