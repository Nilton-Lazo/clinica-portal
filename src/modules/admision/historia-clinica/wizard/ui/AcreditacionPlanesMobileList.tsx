import type { AcreditacionPlan, ContratanteLookup, IafaLookup, PaginatedResponse } from "../acreditacionPlanes.types";
import { MobileEntityList } from "../../../../../shared/crud/MobileEntityList";
import { PaginationFooter } from "../../../../../shared/crud/PaginationFooter";
import { StatusBadge } from "../../../../ficheros/components/StatusBadge";

function planLabel(p: AcreditacionPlan): string {
  const c = (p.tipo_cliente?.codigo ?? "").trim();
  const d = (p.tipo_cliente?.descripcion_tipo_cliente ?? "").trim();
  return c && d ? `${c} · ${d}` : c || d || `#${p.id}`;
}

function parentescoLabel(v: string | null): string {
  const s = (v ?? "").toUpperCase();
  if (s === "NO_DEFINIDO") return "No definido";
  if (s === "TITULAR") return "Titular";
  if (s === "CONYUGE") return "Cónyuge";
  if (s === "HIJO") return "Hijo";
  if (s === "HIJA") return "Hija";
  if (s === "HERMANO") return "Hermano";
  if (s === "HERMANA") return "Hermana";
  if (s === "HIJO_INCAPACITADO") return "Hijo incapacitado";
  if (s === "PADRE") return "Padre";
  if (s === "MADRE") return "Madre";
  if (s === "OTRO") return "Otro";
  return v ? v : "—";
}

function iafaLabel(p: AcreditacionPlan, iafaById: Record<number, IafaLookup>): string {
  const id = p.tipo_cliente?.iafa_id ?? null;
  if (!id) return "—";
  const x = iafaById[id];
  if (!x) return `#${id}`;
  const dc = x.descripcion_corta?.trim();
  if (dc) return dc;
  const rs = x.razon_social?.trim();
  return rs || x.codigo?.trim() || `#${id}`;
}

function contratanteLabel(p: AcreditacionPlan, contratanteById: Record<number, ContratanteLookup>): string {
  const id = p.tipo_cliente?.contratante_id ?? null;
  if (!id) return "—";
  const x = contratanteById[id];
  if (!x) return `#${id}`;
  const rs = x.razon_social?.trim();
  return rs || x.codigo?.trim() || `#${id}`;
}

export default function AcreditacionPlanesMobileList(props: {
  data: PaginatedResponse<AcreditacionPlan>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: AcreditacionPlan) => void;
  page: number;
  onPrev: () => void;
  onNext: () => void;
  emptyText?: string;
  iafaById: Record<number, IafaLookup>;
  contratanteById: Record<number, ContratanteLookup>;
}) {
  const { data, loading, selectedId, onSelect, onPrev, onNext, emptyText, iafaById, contratanteById } = props;

  return (
    <div className="lg:hidden">
      <MobileEntityList
        rows={data.data}
        loading={loading}
        selectedId={selectedId}
        getRowId={(x) => x.id}
        onSelect={onSelect}
        emptyText={emptyText}
        renderMain={(p) => (
          <div className="min-w-0">
            <div className="text-sm font-semibold text-(--color-text-primary)">{planLabel(p)}</div>
            <div className="mt-1 text-xs text-(--color-text-secondary)">
              {iafaLabel(p, iafaById)} · {contratanteLabel(p, contratanteById)} · {parentescoLabel(p.parentesco_seguro)}
            </div>
          </div>
        )}
        renderRight={(p) => <StatusBadge status={p.estado} />}
      />

      <PaginationFooter meta={data.meta} variant="mobile" onPrev={onPrev} onNext={onNext} />
    </div>
  );
}
