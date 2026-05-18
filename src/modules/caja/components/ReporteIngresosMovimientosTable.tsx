import * as React from "react";
import { ListGridWithFooter } from "../../../shared/crud/ListGridWithFooter";
import { GridCellText, type DataGridColumnDef } from "../../../shared/datagrid";
import type { PaginationMeta } from "../../../shared/types/pagination";
import type { SortDirection } from "../../../shared/datagrid/types";
import { AtencionEstadoBadge } from "../../../shared/ui/AtencionEstadoBadge";
import type { ReporteIngresosMovimiento } from "../services/reporteIngresosCaja.service";
import { ReporteSolesAmount } from "./ReporteSolesAmount";

function parseSolesSort(value: string | number | null | undefined): number {
  return parseFloat(String(value ?? "").replace(",", ".")) || 0;
}

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

  const columns = React.useMemo<DataGridColumnDef<ReporteIngresosMovimiento>[]>(
    () => [
      {
        id: "nro_cuenta",
        header: "N° Cuenta",
        columnLabel: "N° Cuenta",
        align: "center",
        size: 90,
        sortable: true,
        sortValue: (x) => x.cuenta ?? "",
        cell: (x) => <span className="tabular-nums text-sm">{x.cuenta || "—"}</span>,
      },
      {
        id: "paciente",
        header: "Paciente",
        align: "left",
        size: 200,
        minSize: 160,
        sortable: true,
        cell: (x) => (
          <GridCellText
            value={x.paciente?.trim() ? x.paciente : "—"}
            title={x.paciente?.trim() ? x.paciente : undefined}
            className="font-medium text-(--color-text-primary)"
          />
        ),
      },
      {
        id: "medico",
        header: "Médico",
        align: "left",
        size: 140,
        minSize: 110,
        sortable: true,
        cell: (x) => (
          <GridCellText
            value={x.medico?.trim() ? x.medico : "—"}
            title={x.medico?.trim() ? x.medico : undefined}
            className="text-(--color-text-secondary)"
          />
        ),
      },
      {
        id: "tipo_origen",
        header: "Tipo",
        align: "center",
        size: 80,
        sortable: true,
        sortValue: (x) => x.origen_sigla ?? "",
        cell: (x) => (
          <span className="text-xs font-semibold text-(--color-text-secondary)">{x.origen_sigla || "—"}</span>
        ),
      },
      {
        id: "tipo_documento",
        header: "Tipo Comp.",
        columnLabel: "Tipo Comp.",
        align: "center",
        size: 120,
        sortable: true,
        sortValue: (x) => x.tipo_comprobante ?? "",
        cell: (x) => (
          <GridCellText
            value={x.tipo_comprobante || "—"}
            title={x.tipo_comprobante || undefined}
            align="center"
            className="text-(--color-text-secondary)"
          />
        ),
      },
      {
        id: "num_comprobante",
        header: "N° Comp.",
        columnLabel: "N° Comp.",
        align: "center",
        size: 100,
        sortable: true,
        cell: (x) => <span className="tabular-nums whitespace-nowrap text-sm">{x.num_comprobante || "—"}</span>,
      },
      {
        id: "medio_pago",
        header: "Medio de pago",
        align: "center",
        size: 110,
        sortable: true,
        cell: (x) => (
          <GridCellText value={x.medio_pago || "—"} title={x.medio_pago || undefined} align="center" />
        ),
      },
      {
        id: "pago_fracc",
        header: "Pago Frac.",
        columnLabel: "Pago Frac.",
        align: "center",
        size: 110,
        sortable: true,
        sortValue: (x) => parseSolesSort(x.pago_fracc),
        cell: (x) => <ReporteSolesAmount value={x.pago_fracc} />,
      },
      {
        id: "adelanto",
        header: "Adelanto",
        align: "center",
        size: 100,
        sortable: true,
        cell: (x) =>
          x.adelanto === "GARANTIA" ? (
            <span className="inline-flex items-center rounded-full border border-(--color-warning) px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-(--color-warning)">
              Garantía
            </span>
          ) : (
            x.adelanto
          ),
      },
      {
        id: "usuario_elimina",
        header: "U. Elimina",
        columnLabel: "U. Elimina",
        align: "center",
        size: 80,
        sortable: true,
        cell: (x) => <span className="text-sm text-(--color-text-secondary)">{x.usuario_elimina}</span>,
      },
      {
        id: "total",
        header: "Total",
        align: "center",
        size: 120,
        sortable: true,
        sortValue: (x) => parseSolesSort(x.total),
        cell: (x) => <ReporteSolesAmount value={x.total} />,
      },
      {
        id: "estado",
        header: "Estado",
        align: "center",
        size: 140,
        sortable: true,
        cell: (x) => (
          <AtencionEstadoBadge value={x.estado?.trim() && x.estado.trim() !== "—" ? x.estado : null} />
        ),
      },
    ],
    []
  );

  const emptyText = sinApertura
    ? "Selecciona una apertura en la tabla superior."
    : "Sin emisiones registradas para esta apertura.";

  return (
    <ListGridWithFooter
      rows={rows}
      columns={columns}
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
