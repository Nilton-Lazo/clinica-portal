import type { RecordStatus } from "../types/historiaClinica.types";
import type { StatusFilter } from "../hooks/useHistoriaClinica";
import { SelectMenu, type SelectOption } from "../../../../shared/ui/SelectMenu";
import { PrimaryButton, SecondaryButton } from "../../../../shared/ui/buttons";

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

  canEdit: boolean;

  onCreate: () => void;
  onEdit: () => void;
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
    canEdit,
    onCreate,
    onEdit,
  } = props;

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
          placeholder="Buscar por HC, NR, apellidos y nombres"
          className={[
            "h-10 rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3",
            "text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)",
            "basis-full lg:basis-auto lg:flex-1 min-w-80",
          ].join(" ")}
        />

        <input
          type="date"
          value={filiacionFrom}
          onChange={(e) => onFiliacionFromChange(e.target.value)}
          className="h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary) sm:w-auto min-w-40"
          aria-label="Filiación desde"
        />

        <input
          type="date"
          value={filiacionTo}
          onChange={(e) => onFiliacionToChange(e.target.value)}
          className="h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary) sm:w-auto min-w-40"
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

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <SecondaryButton disabled={!canEdit} onClick={onEdit}>
            Actualizar registro
          </SecondaryButton>

          <PrimaryButton onClick={onCreate}>
            Registrar paciente
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
