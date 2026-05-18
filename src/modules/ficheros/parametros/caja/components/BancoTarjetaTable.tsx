import { CrudListGrid } from "../../../../../shared/crud/CrudListGrid";
import type { DataGridColumnDef } from "../../../../../shared/datagrid";
import {
  ficherosCodigoColumn,
  ficherosEstadoColumn,
  ficherosMainColumn,
} from "../../../utils/ficherosGridColumns";
import type { BancoTarjetaCajaItem, BancoTarjetaCajaListResponse } from "../services/bancoTarjetaCaja.service";

export default function BancoTarjetaTable(props: {
  data: BancoTarjetaCajaListResponse;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: BancoTarjetaCajaItem) => void;
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

  const columns: DataGridColumnDef<BancoTarjetaCajaItem>[] = [
    ficherosCodigoColumn<BancoTarjetaCajaItem>(),
    ficherosMainColumn<BancoTarjetaCajaItem>({
      id: "descripcion",
      header: "Banco o tarjeta",
      exportValue: (x) => x.descripcion,
      cell: (x) => {
        const secondary = (x.resumen_secundario ?? "").trim() || "—";
        return (
          <div className="min-w-0 wrap-anywhere">
            <div className="whitespace-normal font-medium text-(--color-text-primary)">{x.descripcion || "—"}</div>
            <div className="mt-0.5 whitespace-normal text-xs text-(--color-text-secondary) wrap-anywhere">{secondary}</div>
          </div>
        );
      },
    }),
    ficherosEstadoColumn<BancoTarjetaCajaItem>(),
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
      exportFilename="banco-tarjeta-caja"
    />
  );
}
