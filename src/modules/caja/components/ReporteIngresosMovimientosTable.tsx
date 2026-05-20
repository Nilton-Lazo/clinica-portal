import { ListGridWithFooter } from "../../../shared/crud/ListGridWithFooter";
import type { PaginationMeta } from "../../../shared/types/pagination";
import type { SortDirection } from "../../../shared/datagrid/types";
import type { ReporteIngresosMovimiento } from "../services/reporteIngresosCaja.service";
import { reporteIngresosMovimientosGridColumns } from "./reporteIngresosMovimientosColumns";

export { reporteIngresosMovimientosGridColumns } from "./reporteIngresosMovimientosColumns";

export function ReporteIngresosMovimientosTable(props: {
  rows: ReporteIngresosMovimiento[];
  loading: boolean;
  sinApertura: boolean;
  selectedId: string | null;
  meta: PaginationMeta;
  onSelectRow: (row: ReporteIngresosMovimiento) => void;
  onPrev: () => void;
  onNext: () => void;
  onFirst: () => void;
  onLast: () => void;
  onRefresh: () => void;
  sort?: string | null;
  sortDir?: SortDirection;
  onToggleSort?: (columnId: string) => void;
}) {
  const {
    rows,
    loading,
    sinApertura,
    selectedId,
    meta,
    onSelectRow,
    onPrev,
    onNext,
    onFirst,
    onLast,
    onRefresh,
    sort,
    sortDir,
    onToggleSort,
  } = props;

  const emptyText = sinApertura
    ? "Selecciona una apertura en la tabla superior."
    : "Sin emisiones registradas para esta apertura.";

  return (
    <ListGridWithFooter
      rows={rows}
      columns={reporteIngresosMovimientosGridColumns}
      loading={loading}
      emptyText={emptyText}
      getRowId={(r) => r.id}
      selectedId={selectedId}
      onRowClick={(r) => onSelectRow(r)}
      heightMode="hug"
      meta={meta}
      paginationVariant="desktop"
      onPrev={onPrev}
      onNext={onNext}
      onFirst={onFirst}
      onLast={onLast}
      onRefresh={onRefresh}
      exportFilename="reporte-ingresos-movimientos"
      enableColumnPicker
      enableExport
      sort={sort}
      sortDir={sortDir}
      onToggleSort={onToggleSort}
      enableClientSort={false}
    />
  );
}
