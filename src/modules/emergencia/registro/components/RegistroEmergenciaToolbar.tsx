import type { PeriodPreset } from "../hooks/useRegistroEmergencia";
import { SelectMenu } from "../../../../shared/ui/SelectMenu";
import DateInput from "../../../../shared/ui/DateInput";
import { listPageSizeOptions } from "../../../../shared/crud/listPageSizeOptions";

const inputBase =
  "rounded border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)";

const periodPresets: { id: PeriodPreset; label: string }[] = [
  { id: "hoy", label: "Hoy" },
  { id: "ayer", label: "Ayer" },
  { id: "ultima_semana", label: "Última Semana" },
  { id: "este_mes", label: "Este Mes" },
];

export default function RegistroEmergenciaToolbar(props: {
  q: string;
  onQChange: (v: string) => void;
  fechaDesde: string;
  onFechaDesdeChange: (v: string) => void;
  fechaHasta: string;
  onFechaHastaChange: (v: string) => void;
  perPage: number;
  onPerPageChange: (v: number) => void;
  onNew: () => void;
  periodPreset: PeriodPreset;
  onPeriodPresetChange: (v: PeriodPreset) => void;
}) {
  const {
    q,
    onQChange,
    fechaDesde,
    onFechaDesdeChange,
    fechaHasta,
    onFechaHastaChange,
    perPage,
    onPerPageChange,
    onNew,
    periodPreset,
    onPeriodPresetChange,
  } = props;

  const perPageOptions = listPageSizeOptions;

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Buscar paciente, HC o diagnóstico..."
          className={`h-10 flex-1 w-full min-w-48 ${inputBase}`}
          aria-label="Buscar"
        />
        <div className="flex items-center gap-2 shrink-0">
          {periodPresets.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => onPeriodPresetChange(id)}
              className={[
                "h-10 rounded px-3 text-sm font-medium transition-colors shrink-0",
                periodPreset === id
                  ? "bg-(--color-primary) text-(--color-text-inverse)"
                  : "bg-(--color-panel-context) text-(--color-text-primary) border border-(--border-color-default) hover:bg-(--color-surface-hover)",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DateInput
            value={fechaDesde}
            onChange={onFechaDesdeChange}
            aria-label="Fecha inicio"
            className="min-w-[120px] w-full sm:w-auto"
          />
          <span className="text-sm text-(--color-text-secondary) shrink-0">al</span>
          <DateInput
            value={fechaHasta}
            onChange={onFechaHastaChange}
            aria-label="Fecha fin"
            className="min-w-[120px] w-full sm:w-auto"
          />
        </div>
        <SelectMenu
          value={String(perPage)}
          onChange={(v) => onPerPageChange(Number(v))}
          options={perPageOptions}
          ariaLabel="Registros por página"
          buttonClassName={`min-w-[96px] h-10 shrink-0 ${inputBase}`}
          menuClassName="min-w-[90px]"
        />
        <button
          type="button"
          className="h-10 rounded px-4 text-sm font-medium bg-(--color-primary) text-(--color-text-inverse) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] shrink-0"
          onClick={onNew}
        >
          Nuevo Registro
        </button>
      </div>
    </div>
  );
}
