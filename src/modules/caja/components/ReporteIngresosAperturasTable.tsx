import * as React from "react";
import { ListGridWithFooter } from "../../../shared/crud/ListGridWithFooter";
import { GridCellText, type DataGridColumnDef } from "../../../shared/datagrid";
import type { PaginationMeta } from "../../../shared/types/pagination";
import type { SortDirection } from "../../../shared/datagrid/types";
import { AtencionEstadoBadge } from "../../../shared/ui/AtencionEstadoBadge";
import { CajaAperturaTipoBadge } from "./CajaAperturaTipoBadge";
import { ReporteSolesAmount } from "./ReporteSolesAmount";
import { codigoAperturaIdColumna } from "../utils/codigoAperturaIdColumna";
import type { ReporteIngresosApertura } from "../services/reporteIngresosCaja.service";

export function ReporteIngresosAperturasTable(props: {
  rows: ReporteIngresosApertura[];
  loading: boolean;
  selectedId: string | number | null;
  meta: PaginationMeta;
  onSelect: (row: ReporteIngresosApertura) => void;
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
    selectedId,
    meta,
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

  const columns = React.useMemo<DataGridColumnDef<ReporteIngresosApertura>[]>(
    () => [
      {
        id: "codigo",
        header: "ID",
        align: "center",
        size: 72,
        sortable: true,
        sortValue: (x) => codigoAperturaIdColumna(x.codigo),
        cell: (x) => <span className="tabular-nums text-sm">{codigoAperturaIdColumna(x.codigo)}</span>,
      },
      {
        id: "usuario",
        header: "Usuario",
        align: "center",
        size: 100,
        sortable: true,
        cell: (x) => <GridCellText value={x.usuario || "—"} align="center" title={x.usuario || undefined} />,
      },
      {
        id: "fecha",
        header: "Fecha",
        align: "center",
        size: 108,
        sortable: true,
        cell: (x) => <span className="whitespace-nowrap text-sm text-(--color-text-secondary)">{x.fecha}</span>,
      },
      {
        id: "monto_apertura",
        header: "Monto de apertura",
        align: "center",
        size: 130,
        sortable: true,
        sortValue: (x) => parseFloat(String(x.monto_apertura).replace(",", ".")) || 0,
        cell: (x) => <ReporteSolesAmount value={x.monto_apertura} />,
      },
      {
        id: "monto_cierre",
        header: "Monto de cierre",
        align: "center",
        size: 130,
        sortable: true,
        sortValue: (x) => parseFloat(String(x.monto_cierre).replace(",", ".")) || 0,
        cell: (x) => <ReporteSolesAmount value={x.monto_cierre} muted />,
      },
      {
        id: "estado",
        header: "Estado",
        align: "center",
        size: 120,
        sortable: true,
        cell: (x) => <AtencionEstadoBadge value={x.estado} />,
      },
      {
        id: "tipo",
        header: "Tipo",
        align: "center",
        size: 100,
        sortable: true,
        cell: (x) => <CajaAperturaTipoBadge value={x.tipo} />,
      },
    ],
    []
  );

  return (
    <ListGridWithFooter
      rows={rows}
      columns={columns}
      loading={loading}
      emptyText="No hay aperturas registradas para tu usuario."
      getRowId={(r) => r.id}
      selectedId={selectedId}
      onRowClick={(r) => onSelect(r)}
      heightMode="hug"
      meta={meta}
      paginationVariant="desktop"
      onPrev={onPrev}
      onNext={onNext}
      onFirst={onFirst}
      onLast={onLast}
      onRefresh={onRefresh}
      exportFilename="reporte-ingresos-aperturas"
      enableColumnPicker
      enableExport
      sort={sort}
      sortDir={sortDir}
      onToggleSort={onToggleSort}
      enableClientSort={false}
    />
  );
}
