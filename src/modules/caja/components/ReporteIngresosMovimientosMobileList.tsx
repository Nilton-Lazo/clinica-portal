import { MobileEntityList } from "../../../shared/crud/MobileEntityList";
import type { ReporteIngresosMovimiento } from "../services/reporteIngresosCaja.service";
import { AtencionEstadoBadge } from "../../../shared/ui/AtencionEstadoBadge";
import { ReporteSolesAmount } from "./ReporteSolesAmount";

export function ReporteIngresosMovimientosMobileList(props: {
  rows: ReporteIngresosMovimiento[];
  loading: boolean;
  sinApertura: boolean;
  selectedId: string | null;
  onSelectRow: (row: ReporteIngresosMovimiento) => void;
}) {
  const { rows, loading, sinApertura, selectedId, onSelectRow } = props;

  const emptyText = sinApertura
    ? "Selecciona una apertura en la lista superior."
    : "Sin emisiones registradas para esta apertura.";

  return (
    <MobileEntityList
      rows={rows}
      loading={loading}
      selectedId={selectedId}
      getRowId={(r) => r.id}
      onSelect={(r) => onSelectRow(r)}
      emptyText={emptyText}
      renderMain={(x) => (
        <div className="min-w-0 space-y-1.5">
          <div className="text-sm font-semibold leading-snug text-(--color-text-primary)">
            {x.paciente?.trim() ? x.paciente : "—"}
          </div>
          <div className="text-xs text-(--color-text-secondary)">
            Cuenta {x.cuenta || "—"} · {x.origen_sigla || "—"} · {x.tipo_comprobante || "—"} · {x.num_comprobante || "—"}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--color-text-secondary)">
            <span>{x.medico?.trim() ? x.medico : "—"}</span>
            <span className="tabular-nums text-(--color-text-primary)">{x.medio_pago || "—"}</span>
            {x.adelanto === "GARANTIA" ? (
              <span className="inline-flex items-center rounded-full border border-(--color-warning) px-2 py-0.5 font-semibold uppercase tracking-wide text-(--color-warning)">
                Garantía
              </span>
            ) : null}
          </div>
        </div>
      )}
      renderRight={(x) => (
        <div className="flex shrink-0 flex-col items-end gap-2">
          <ReporteSolesAmount value={x.total} />
          <AtencionEstadoBadge value={x.estado?.trim() && x.estado.trim() !== "—" ? x.estado : null} />
        </div>
      )}
    />
  );
}
