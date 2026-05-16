import * as React from "react";
import { DataTable, type DataTableColumn } from "../../../shared/crud/DataTable";
import { AtencionEstadoBadge } from "../../../shared/ui/AtencionEstadoBadge";
import type { ReporteIngresosMovimiento } from "../services/reporteIngresosCaja.service";
import { ReporteSolesAmount } from "./ReporteSolesAmount";

function ThStack({ top, bottom }: { top: string; bottom: string }) {
  return (
    <span className="inline-flex flex-col items-center justify-center gap-0 leading-[1.15]">
      <span className="block whitespace-nowrap">{top}</span>
      <span className="block whitespace-nowrap">{bottom}</span>
    </span>
  );
}

const centerTh = "text-center align-middle";
const centerTd = "px-3 py-2 align-middle text-center tabular-nums text-sm text-(--color-text-primary)";
const leftTdPaciente =
  "px-3 py-2 align-middle text-left text-sm text-(--color-text-primary) max-w-[min(28rem,44vw)]";
const leftTdMedico =
  "px-3 py-2 align-middle text-left text-sm text-(--color-text-secondary) max-w-[min(28rem,44vw)]";

export function ReporteIngresosMovimientosTable(props: {
  rows: ReporteIngresosMovimiento[];
  loading: boolean;
  sinApertura: boolean;
  selectedId: string | null;
  onSelectRow: (row: ReporteIngresosMovimiento) => void;
}) {
  const { rows, loading, sinApertura, selectedId, onSelectRow } = props;

  const columns = React.useMemo<DataTableColumn<ReporteIngresosMovimiento>[]>(
    () => [
      {
        key: "nro_cuenta",
        header: <ThStack top="N°" bottom="Cuenta" />,
        headerClassName: `${centerTh} min-w-[4.25rem] max-w-[5rem]`,
        cellClassName: centerTd,
        render: (x) => x.cuenta || "—",
      },
      {
        key: "paciente",
        header: "Paciente",
        headerClassName: `${centerTh} min-w-[200px]`,
        cellClassName: leftTdPaciente,
        render: (x) => (
          <span className="block max-w-full whitespace-normal wrap-break-word leading-snug font-medium text-(--color-text-primary)">
            {x.paciente?.trim() ? x.paciente : "—"}
          </span>
        ),
      },
      {
        key: "medico",
        header: "Medico",
        headerClassName: `${centerTh} min-w-[200px]`,
        cellClassName: leftTdMedico,
        render: (x) => (
          <span className="block max-w-full whitespace-normal wrap-break-word leading-snug text-(--color-text-secondary)">
            {x.medico?.trim() ? x.medico : "—"}
          </span>
        ),
      },
      {
        key: "tipo_origen",
        header: "Tipo",
        headerClassName: `${centerTh} w-[4.5rem] min-w-[4rem]`,
        cellClassName: `${centerTd} text-xs font-semibold text-(--color-text-secondary)`,
        render: (x) => x.origen_sigla || "—",
      },
      {
        key: "tipo_documento",
        header: "Tipo Comp.",
        headerClassName: `${centerTh} min-w-[8rem] max-w-[10rem]`,
        cellClassName: `${centerTd} text-(--color-text-secondary)`,
        render: (x) => (
          <span className="inline-block max-w-full whitespace-normal wrap-break-word leading-snug">
            {x.tipo_comprobante || "—"}
          </span>
        ),
      },
      {
        key: "num_comprobante",
        header: <ThStack top="N°" bottom="Comp." />,
        headerClassName: `${centerTh} min-w-[5rem] max-w-[6.5rem]`,
        cellClassName: `${centerTd} whitespace-nowrap`,
        render: (x) => x.num_comprobante || "—",
      },
      {
        key: "medio_pago",
        header: <ThStack top="Medio de" bottom="pago" />,
        headerClassName: `${centerTh} min-w-[4.5rem] max-w-[6rem]`,
        cellClassName: `${centerTd} max-w-[14rem]`,
        render: (x) => (
          <span className="inline-block max-w-full whitespace-normal wrap-break-word leading-snug align-middle" title={x.medio_pago}>
            {x.medio_pago || "—"}
          </span>
        ),
      },
      {
        key: "pago_fracc",
        header: <ThStack top="Pago" bottom="Frac." />,
        headerClassName: `${centerTh} min-w-[6.5rem]`,
        cellClassName: "px-3 py-2 align-middle text-sm",
        render: (x) => (
          <div className="flex w-full justify-center">
            <ReporteSolesAmount value={x.pago_fracc} />
          </div>
        ),
      },
      {
        key: "adelante",
        header: "Adelanto",
        headerClassName: `${centerTh} w-[6rem]`,
        cellClassName: `${centerTd} text-(--color-text-secondary)`,
        render: (x) =>
          x.adelanto === "GARANTIA" ? (
            <span className="inline-flex items-center rounded-full border border-(--color-warning) px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-(--color-warning)">
              Garantía
            </span>
          ) : (
            x.adelanto
          ),
      },
      {
        key: "usuario_elimina",
        header: <ThStack top="U." bottom="Elimina" />,
        headerClassName: `${centerTh} min-w-[3.25rem]`,
        cellClassName: `${centerTd} text-(--color-text-secondary)`,
        render: (x) => x.usuario_elimina,
      },
      {
        key: "total",
        header: "Total",
        headerClassName: `${centerTh} w-[8.5rem] min-w-[8rem]`,
        cellClassName: "px-3 py-2 align-middle text-sm",
        render: (x) => (
          <div className="flex w-full justify-center">
            <ReporteSolesAmount value={x.total} />
          </div>
        ),
      },
      {
        key: "estado",
        header: "Estado",
        headerClassName: `${centerTh} min-w-[10rem]`,
        cellClassName: `${centerTd}`,
        render: (x) => (
          <div className="flex justify-center">
            <AtencionEstadoBadge value={x.estado?.trim() && x.estado.trim() !== "—" ? x.estado : null} />
          </div>
        ),
      },
    ],
    []
  );

  const emptyText = sinApertura
    ? "Selecciona una apertura en la tabla superior."
    : "Sin emisiones registradas para esta apertura.";

  return (
    <div className="w-full min-w-0">
      <DataTable
        rows={rows}
        columns={columns}
        loading={loading}
        selectedId={selectedId}
        getRowId={(r) => r.id}
        onSelect={(r) => onSelectRow(r)}
        emptyText={emptyText}
        tableClassName="min-w-[1100px]"
        heightMode="hug"
      />
    </div>
  );
}
