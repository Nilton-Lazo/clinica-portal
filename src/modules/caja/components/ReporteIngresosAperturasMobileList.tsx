import { MobileEntityList } from "../../../shared/crud/MobileEntityList";
import type { ReporteIngresosApertura } from "../services/reporteIngresosCaja.service";
import { AtencionEstadoBadge } from "../../../shared/ui/AtencionEstadoBadge";
import { CajaAperturaTipoBadge } from "./CajaAperturaTipoBadge";
import { ReporteSolesAmount } from "./ReporteSolesAmount";
import { codigoAperturaIdColumna } from "../utils/codigoAperturaIdColumna";

export function ReporteIngresosAperturasMobileList(props: {
  rows: ReporteIngresosApertura[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (row: ReporteIngresosApertura) => void;
}) {
  const { rows, loading, selectedId, onSelect } = props;

  return (
    <MobileEntityList
      rows={rows}
      loading={loading}
      selectedId={selectedId}
      getRowId={(r) => r.id}
      onSelect={onSelect}
      emptyText="No hay aperturas registradas para tu usuario."
      renderMain={(r) => (
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold tabular-nums text-(--color-text-primary)">
              ID {codigoAperturaIdColumna(r.codigo)}
            </span>
            <span className="text-xs text-(--color-text-secondary)">{r.fecha}</span>
          </div>
          <div className="text-xs text-(--color-text-secondary)">{r.usuario}</div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
            <div className="flex items-baseline gap-1.5 text-(--color-text-secondary)">
              <span>Apert.</span>
              <ReporteSolesAmount value={r.monto_apertura} />
            </div>
            <div className="flex items-baseline gap-1.5 text-(--color-text-secondary)">
              <span>Cierre</span>
              <ReporteSolesAmount value={r.monto_cierre} muted />
            </div>
          </div>
        </div>
      )}
      renderRight={(r) => (
        <div className="flex max-w-40 shrink-0 flex-col items-end gap-1.5">
          <AtencionEstadoBadge value={r.estado} />
          <CajaAperturaTipoBadge value={r.tipo} />
        </div>
      )}
    />
  );
}
