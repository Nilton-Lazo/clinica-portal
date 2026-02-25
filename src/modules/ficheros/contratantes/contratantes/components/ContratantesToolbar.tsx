import type { RecordStatus } from "../../types/contratantes.types";
import type { StatusFilter } from "../hooks/useContratantes";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";

export default function ContratantesToolbar(props: {
  q: string;
  onQChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  perPage: number;
  onPerPageChange: (v: number) => void;
  onNew: () => void;
}) {
  const { q, onQChange, statusFilter, onStatusChange, perPage, onPerPageChange, onNew } = props;

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
          placeholder="Buscar por código, razón social, etc."
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

        <button
          type="button"
          className="h-10 rounded-xl px-4 text-sm font-medium bg-(--color-primary) text-(--color-text-inverse) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] w-full sm:w-auto"
          onClick={onNew}
        >
          Nuevo
        </button>
      </div>
    </div>
  );
}
