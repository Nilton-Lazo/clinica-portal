import type { RecordStatus } from "../types/historiaClinica.types";
import type { StatusFilter } from "../hooks/useHistoriaClinica";
import { SelectMenu, type SelectOption } from "../../../../shared/ui/SelectMenu";
import { PrimaryButton } from "../../../../shared/ui/buttons";
import { listPageSizeOptions } from "../../../../shared/crud/listPageSizeOptions";

export default function HistoriaClinicaToolbar(props: {
  q: string;
  onQChange: (v: string) => void;

  filiacionFrom: string;
  filiacionTo: string;
  onFiliacionFromChange: (v: string) => void;
  onFiliacionToChange: (v: string) => void;

  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;

  perPage: number;
  onPerPageChange: (v: number) => void;

  onCreate: () => void;
}) {
  const {
    q,
    onQChange,
    filiacionFrom,
    filiacionTo,
    onFiliacionFromChange,
    onFiliacionToChange,
    statusFilter,
    onStatusChange,
    perPage,
    onPerPageChange,
    onCreate,
  } = props;

  const statusOptions: SelectOption[] = [
    { value: "ALL", label: "Todos" },
    { value: "ACTIVO", label: "Activos" },
    { value: "INACTIVO", label: "Inactivos" },
    { value: "SUSPENDIDO", label: "Suspendidos" },
  ];

  const perPageOptions = listPageSizeOptions;

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Buscar por HC, NR, apellidos y nombres"
          className={[
            "h-10 rounded-md border border-(--border-color-default) bg-(--color-surface) px-3",
            "text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary)",
            "basis-full lg:basis-auto lg:flex-1 min-w-80",
          ].join(" ")}
        />

        <input
          type="date"
          value={filiacionFrom}
          onChange={(e) => onFiliacionFromChange(e.target.value)}
          className="h-10 w-full rounded-md border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) sm:w-auto min-w-40"
          aria-label="Filiación desde"
        />

        <input
          type="date"
          value={filiacionTo}
          onChange={(e) => onFiliacionToChange(e.target.value)}
          className="h-10 w-full rounded-md border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-0 focus:border-(--color-primary) sm:w-auto min-w-40"
          aria-label="Filiación hasta"
        />

        <SelectMenu
          value={String(statusFilter)}
          onChange={(v) => onStatusChange(v === "ALL" ? "ALL" : (v as RecordStatus))}
          options={statusOptions}
          ariaLabel="Filtrar por estado"
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

        <PrimaryButton onClick={onCreate}>
          Registrar paciente
        </PrimaryButton>
      </div>
    </div>
  );
}
