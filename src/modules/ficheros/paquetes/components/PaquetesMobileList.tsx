import type { Paquete, PaginatedResponse } from "../../types/paquetes.types";
import { StatusBadge } from "../../components/StatusBadge";
import { MobileEntityList } from "../../../../shared/crud/MobileEntityList";
import { PaginationFooter } from "../../../../shared/crud/PaginationFooter";
import { formatDecimalDisplay } from "../../../../shared/constants/decimalPrecision";

function vigenciaDisplay(iso: string): string {
  const t = (iso ?? "").trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return "—";
  const [y, m, d] = t.split("-");
  return `${d}/${m}/${y}`;
}

function diasHospitalizacionDisplay(d: number | null): string {
  if (d === null) return "—";
  return `${d} días`;
}

export default function PaquetesMobileList(props: {
  data: PaginatedResponse<Paquete>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Paquete) => void;
  page: number;
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
}) {
  const { data, loading, selectedId, onSelect, onPrev, onNext, onFirst, onLast } = props;

  return (
    <div className="lg:hidden">
      <MobileEntityList
        rows={data.data}
        loading={loading}
        selectedId={selectedId}
        getRowId={(x) => x.id}
        onSelect={onSelect}
        renderMain={(x) => {
          const tc = (x.tarifa?.codigo ?? "").trim();
          const td = (x.tarifa?.descripcion_tarifa ?? "").trim();
          const tarifaLine = tc && td ? `${tc} · ${td}` : tc || td;
          return (
            <div className="min-w-0">
              <div className="text-sm font-semibold text-(--color-text-primary)">
                <span className="tabular-nums">{x.codigo || "—"}</span> · {x.descripcion || "—"}
              </div>
              <div className="mt-1 text-xs text-(--color-text-secondary) wrap-anywhere">
                {tarifaLine ? `${tarifaLine} · ` : ""}S/ {formatDecimalDisplay(x.precio_sin_igv)} sin IGV · Vig. {vigenciaDisplay(x.vigencia_actual)} · {diasHospitalizacionDisplay(x.dias_hospitalizacion)}
              </div>
            </div>
          );
        }}
        renderRight={(x) => <StatusBadge status={x.estado} />}
      />

      <PaginationFooter meta={data.meta} variant="mobile" onPrev={onPrev} onNext={onNext} onFirst={onFirst} onLast={onLast} />
    </div>
  );
}
