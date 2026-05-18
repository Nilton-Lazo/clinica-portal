import type { Cliente, ClienteTipo, PaginatedResponse } from "../../types/clientes.types";
import { CrudListGrid } from "../../../../shared/crud/CrudListGrid";
import type { DataGridColumnDef } from "../../../../shared/datagrid";
import { ficherosCodigoColumn, ficherosEstadoColumn, ficherosMainColumn } from "../../utils/ficherosGridColumns";

function tipoLabel(t: ClienteTipo): string {
  return t === "ADMINISTRATIVO" ? "Administrativo" : "Asistencial";
}

export default function ClientesTable(props: {
  data: PaginatedResponse<Cliente>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Cliente) => void;
  page?: number;
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

  const columns: DataGridColumnDef<Cliente>[] = [
    ficherosCodigoColumn<Cliente>(),
    ficherosMainColumn<Cliente>({
      id: "nombre",
      header: "Cliente",
      exportValue: (x) => x.nombre,
      cell: (x) => (
        <div className="min-w-0 wrap-anywhere">
          <div className="whitespace-normal text-(--color-text-primary)">{x.nombre || "—"}</div>
          <div className="mt-0.5 whitespace-normal text-xs text-(--color-text-secondary) wrap-anywhere">
            {tipoLabel(x.tipo)}
            {` · ${x.dni_o_ruc.length === 8 ? "DNI" : "RUC"} ${x.dni_o_ruc}`}
            {x.telefono ? ` · Tel ${x.telefono}` : ""}
          </div>
        </div>
      ),
    }),
    ficherosEstadoColumn<Cliente>(),
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
      exportFilename="clientes"
    />
  );
}
