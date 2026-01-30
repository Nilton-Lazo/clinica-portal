import type { RecordStatus } from "../acreditacionPlanes.types";
import type { StatusFilter } from "../useAcreditacionPlanes";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { PrimaryButton, SecondaryButton } from "../../../../../shared/ui/buttons";

export default function AcreditacionPlanesToolbar(props: {
  q: string;
  onQChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  perPage: number;
  onPerPageChange: (v: number) => void;
  onNew: () => void;
  onRefresh: () => void;
  refreshDisabled?: boolean;
}) {
  const { q, onQChange, statusFilter, onStatusChange, perPage, onPerPageChange, onNew, onRefresh, refreshDisabled } =
    props;

  const statusOptions: SelectOption[] = [
    { value: "ALL", label: "Todos" },
    { value: "ACTIVO", label: "Activos" },
    { value: "INACTIVO", label: "Inactivos" },
    { value: "SUSPENDIDO", label: "Suspendidos" },
  ];

  const perPageOptions: SelectOption[] = [
    { value: "25", label: "25" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Buscar por plan, código o parentesco"
          className={[
            "h-10 rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3",
            "text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)",
            "basis-full lg:basis-auto lg:flex-1 min-w-65",
          ].join(" ")}
        />

        <SelectMenu
          value={String(statusFilter)}
          onChange={(v) => onStatusChange(v === "ALL" ? "ALL" : (v as RecordStatus))}
          options={statusOptions}
          ariaLabel="Filtrar por estado"
          buttonClassName="w-full sm:w-auto min-w-[160px]"
          menuClassName="min-w-[150px]"
        />

        <SelectMenu
          value={String(perPage)}
          onChange={(v) => onPerPageChange(Number(v))}
          options={perPageOptions}
          ariaLabel="Registros por página"
          buttonClassName="w-full sm:w-auto min-w-[96px]"
          menuClassName="min-w-[90px]"
        />

        <SecondaryButton disabled={Boolean(refreshDisabled)} onClick={onRefresh} className="w-full sm:w-auto">
          Actualizar
        </SecondaryButton>

        <PrimaryButton onClick={onNew} className="w-full sm:w-auto">
          Nuevo
        </PrimaryButton>
      </div>
    </div>
  );
}
