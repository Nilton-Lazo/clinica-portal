import type { RecordStatus } from "../../../../../shared/types/recordStatus";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import type { StatusFilter } from "../hooks/useProgramacionMedica";
import * as React from "react";
import { Calendar } from "lucide-react";

export default function ProgramacionMedicaListBar(props: {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;

  q: string;
  onQChange: (v: string) => void;

  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;

  perPage: number;
  onPerPageChange: (v: number) => void;

  onNew: () => void;
}) {
  const {
    from,
    to,
    onFromChange,
    onToChange,
    q,
    onQChange,
    statusFilter,
    onStatusChange,
    perPage,
    onPerPageChange,
    onNew,
  } = props;

  const isTouchUi = useIsTouchUi();

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

  const inputCls = [
    "h-10 rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3",
    "text-sm text-(--color-text-primary) outline-none focus:ring-2 focus:ring-(--color-primary)",
    "w-full min-w-0",
  ].join(" ");

  function useIsTouchUi(): boolean {
    const [isTouch, setIsTouch] = React.useState(() => {
      if (typeof window === "undefined") return false;
      return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    });
  
    React.useEffect(() => {
      const mq = window.matchMedia("(hover: none) and (pointer: coarse)");
      const onChange = () => setIsTouch(mq.matches);
      onChange();
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }, []);
  
    return isTouch;
  }
  
  function formatDateForDisplay(iso: string): string {
    const t = (iso ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return "";
    const [y, m, d] = t.split("-");
    return `${d}/${m}/${y}`;
  }  

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          className={[inputCls, "lg:flex-1"].join(" ")}
          placeholder="Buscar por médico, especialidad, etc."
          aria-label="Buscar"
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
            <div className="text-xs text-(--color-text-secondary)">Desde</div>
            {isTouchUi ? (
              <div className="relative rounded-xl focus-within:ring-2 focus-within:ring-(--color-primary) w-full sm:w-auto">
                <div className="h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 pr-10 text-sm flex items-center">
                  <span className={from ? "text-(--color-text-primary)" : "text-(--color-base-primary)"}>
                    {from ? formatDateForDisplay(from) : "dd/mm/aaaa"}
                  </span>
                </div>

                <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-icon-primary)" />

                <input
                  type="date"
                  value={from}
                  onChange={(e) => onFromChange(e.target.value)}
                  className="absolute inset-0 h-10 w-full cursor-pointer opacity-0"
                  aria-label="Desde"
                />
              </div>
            ) : (
              <input
                type="date"
                value={from}
                onChange={(e) => onFromChange(e.target.value)}
                className={[inputCls, "sm:w-auto"].join(" ")}
                aria-label="Desde"
              />
            )}
          </div>

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
            <div className="text-xs text-(--color-text-secondary)">Hasta</div>
            {isTouchUi ? (
              <div className="relative rounded-xl focus-within:ring-2 focus-within:ring-(--color-primary) w-full sm:w-auto">
                <div className="h-10 w-full rounded-xl border border-(--border-color-default) bg-(--color-surface) px-3 pr-10 text-sm flex items-center">
                  <span className={to ? "text-(--color-text-primary)" : "text-(--color-base-primary)"}>
                    {to ? formatDateForDisplay(to) : "dd/mm/aaaa"}
                  </span>
                </div>

                <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-icon-primary)" />

                <input
                  type="date"
                  value={to}
                  onChange={(e) => onToChange(e.target.value)}
                  className="absolute inset-0 h-10 w-full cursor-pointer opacity-0"
                  aria-label="Hasta"
                />
              </div>
            ) : (
              <input
                type="date"
                value={to}
                onChange={(e) => onToChange(e.target.value)}
                className={[inputCls, "sm:w-auto"].join(" ")}
                aria-label="Hasta"
              />
            )}
          </div>
        </div>

        <SelectMenu
          value={String(statusFilter)}
          onChange={(v) => onStatusChange(v === "ALL" ? "ALL" : (v as RecordStatus))}
          options={statusOptions}
          ariaLabel="Filtrar por estado"
          buttonClassName="w-full lg:w-auto min-w-[160px]"
          menuClassName="min-w-[140px]"
        />

        <SelectMenu
          value={String(perPage)}
          onChange={(v) => onPerPageChange(Number(v))}
          options={perPageOptions}
          ariaLabel="Registros por página"
          buttonClassName="w-full lg:w-auto min-w-[96px]"
          menuClassName="min-w-[90px]"
        />

        <button
          type="button"
          className="h-10 rounded-xl px-4 text-sm font-medium bg-(--color-primary) text-(--color-text-inverse) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] w-full lg:w-auto lg:ml-auto"
          onClick={onNew}
        >
          Nuevo
        </button>
      </div>
    </div>
  );
}
