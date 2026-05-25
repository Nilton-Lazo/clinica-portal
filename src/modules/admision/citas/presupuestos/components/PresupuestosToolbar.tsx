import type { EstadoPresupuestoFiltro } from "../hooks/usePresupuestosLista";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { PrimaryButton } from "../../../../../shared/ui/buttons";
import DateInput from "../../../../../shared/ui/DateInput";
import { listPageSizeOptions } from "../../../../../shared/crud/listPageSizeOptions";

export default function PresupuestosToolbar(props: {
  q: string;
  onQChange: (v: string) => void;
  vigenciaDesde: string;
  vigenciaHasta: string;
  onVigenciaDesdeChange: (v: string) => void;
  onVigenciaHastaChange: (v: string) => void;
  estadoFilter: EstadoPresupuestoFiltro;
  onEstadoChange: (v: EstadoPresupuestoFiltro) => void;
  perPage: number;
  onPerPageChange: (v: number) => void;
  onGenerar: () => void;
}) {
  const {
    q,
    onQChange,
    vigenciaDesde,
    vigenciaHasta,
    onVigenciaDesdeChange,
    onVigenciaHastaChange,
    estadoFilter,
    onEstadoChange,
    perPage,
    onPerPageChange,
    onGenerar,
  } = props;

  const estadoOptions: SelectOption[] = [
    { value: "ALL", label: "Todos" },
    { value: "VIGENTE", label: "Vigente" },
    { value: "UTILIZADO", label: "Utilizado" },
    { value: "VENCIDO", label: "Vencido" },
    { value: "ANULADO", label: "Anulado" },
  ];

  const perPageOptions = listPageSizeOptions;

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Buscar por código, HC, NR, apellidos y nombres"
          className={[
            "h-10 rounded-md border border-(--border-color-default) bg-(--color-surface) px-3",
            "text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)",
            "basis-full lg:basis-auto lg:flex-1 min-w-80",
          ].join(" ")}
        />

        <DateInput
          value={vigenciaDesde}
          onChange={onVigenciaDesdeChange}
          aria-label="Vigencia desde"
          className="w-full min-w-40 sm:w-auto"
        />

        <DateInput
          value={vigenciaHasta}
          onChange={onVigenciaHastaChange}
          aria-label="Vigencia hasta"
          className="w-full min-w-40 sm:w-auto"
        />

        <SelectMenu
          value={estadoFilter}
          onChange={(v) => onEstadoChange((v ?? "ALL") as EstadoPresupuestoFiltro)}
          options={estadoOptions}
          ariaLabel="Filtrar por estado del presupuesto"
          buttonClassName="w-full sm:w-auto min-w-[160px]"
          menuClassName="min-w-[120px]"
        />

        <SelectMenu
          value={String(perPage)}
          onChange={(v) => onPerPageChange(Number(v))}
          options={perPageOptions}
          ariaLabel="Registros por página"
          buttonClassName="w-full sm:w-auto min-w-[96px]"
          menuClassName="min-w-[90px]"
        />

        <PrimaryButton type="button" onClick={onGenerar}>
          Generar presupuesto
        </PrimaryButton>
      </div>
    </div>
  );
}
