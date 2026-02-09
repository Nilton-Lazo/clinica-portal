import * as React from "react";
import type { StatusFilter } from "../hooks/useRecargoNoche";
import type { TarifaOperativa } from "../../services/recargoNoche.service";
import { SelectMenu } from "../../../../../shared/ui/SelectMenu";

type Opt = { value: string; label: string };

export default function RecargoNocheToolbar(props: {
  tarifas: TarifaOperativa[];
  tarifasLoading: boolean;
  tarifaId: number | null;
  onTarifaChange: (id: number | null) => void;
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  onNew: () => void;
}) {
  const {
    tarifas,
    tarifasLoading,
    tarifaId,
    onTarifaChange,
    statusFilter,
    onStatusChange,
    onNew,
  } = props;

  const tarifaOptions: Opt[] = React.useMemo(
    () => [
      { value: "", label: "Seleccionar tarifario" },
      ...tarifas.map((t) => ({
        value: String(t.id),
        label: `${t.codigo} · ${t.descripcion_tarifa ?? ""}`.trim() || String(t.id),
      })),
    ],
    [tarifas]
  );

  const statusOptions: Opt[] = [
    { value: "ALL", label: "Todos" },
    { value: "ACTIVO", label: "Activos" },
    { value: "INACTIVO", label: "Inactivos" },
    { value: "SUSPENDIDO", label: "Pendiente" },
  ];

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end gap-2 lg:flex-nowrap">
        <div className="basis-full min-w-0 lg:basis-auto lg:min-w-[200px]">
          <label className="text-xs text-(--color-text-secondary)">Tarifario</label>
          <SelectMenu
            value={tarifaId != null ? String(tarifaId) : ""}
            onChange={(v) => onTarifaChange(v ? Number(v) : null)}
            options={tarifaOptions}
            ariaLabel="Tarifario"
            disabled={tarifasLoading}
            buttonClassName="mt-1 w-full"
            menuClassName="w-full min-w-0"
          />
        </div>

        <div className="basis-full sm:basis-auto">
          <label className="text-xs text-(--color-text-secondary)">Estado</label>
          <SelectMenu
            value={String(statusFilter)}
            onChange={(v) => onStatusChange(v as StatusFilter)}
            options={statusOptions}
            ariaLabel="Filtrar por estado"
            buttonClassName="mt-1 w-full sm:w-auto min-w-[140px]"
            menuClassName="min-w-[140px]"
          />
        </div>

        <div>
          <button
            type="button"
            className="h-10 rounded-xl px-4 text-sm font-medium bg-(--color-primary) text-(--color-text-inverse) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] w-full sm:w-auto"
            onClick={onNew}
            disabled={!tarifaId}
          >
            Nuevo
          </button>
        </div>
      </div>
    </div>
  );
}
