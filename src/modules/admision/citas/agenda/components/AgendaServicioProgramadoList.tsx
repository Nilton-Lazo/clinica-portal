import * as React from "react";
import type { AgendaEspecialidadOption } from "../types/agendaMedica.types";

const cellBorder = "border-b border-r border-(--border-color-default) last:border-r-0";

const gridCols = "grid-cols-[4rem_1fr_4.5rem]";

export default function AgendaServicioProgramadoList({
  list,
  selectedId,
  onSelect,
  loading,
  emptyMessage = "Sin servicios programados",
}: {
  list: AgendaEspecialidadOption[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  loading: boolean;
  emptyMessage?: string;
}) {
  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center border border-(--border-color-default) bg-(--color-surface) p-4">
        <span className="text-sm text-(--color-text-secondary)">Cargando servicios…</span>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center border border-(--border-color-default) bg-(--color-surface) p-4">
        <span className="text-sm text-(--color-text-secondary)">{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className="border border-(--border-color-default) bg-(--color-surface)">
      <div className={`grid ${gridCols} border-b border-(--border-color-default) bg-(--color-panel-context)`}>
        <div className={`px-2 py-2 text-center text-xs font-semibold text-(--color-text-secondary) ${cellBorder}`}>
          Código
        </div>
        <div className={`px-2 py-2 text-left text-xs font-semibold text-(--color-text-secondary) ${cellBorder}`}>
          Especialidad
        </div>
        <div className={`px-2 py-2 text-center text-xs font-semibold text-(--color-text-secondary) ${cellBorder}`}>
          Cupos
        </div>
      </div>
      <div className="max-h-[280px] overflow-y-auto">
        {list.map((e) => {
          const isSelected = selectedId === e.id;
          const cupos = e.cupos_disponibles ?? 0;
          const cuposStr = cupos <= 0 ? "00" : String(cupos).padStart(2, "0");
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => onSelect(e.id)}
              className={[
                `grid w-full ${gridCols} text-left transition-colors`,
                isSelected
                  ? "bg-(--color-panel-options-bg) ring-1 ring-(--color-primary)"
                  : "hover:bg-(--color-panel-options-bg)",
              ].join(" ")}
              aria-pressed={isSelected}
              aria-label={`Seleccionar ${e.codigo} ${e.descripcion}`}
            >
              <div className={`px-2 py-2 text-center text-sm tabular-nums text-(--color-text-primary) ${cellBorder}`}>
                {e.codigo}
              </div>
              <div className={`min-w-0 px-2 py-2 text-left text-sm text-(--color-text-primary) truncate ${cellBorder}`}>
                {e.descripcion}
              </div>
              <div className={`px-2 py-2 text-center text-sm tabular-nums text-(--color-text-primary) ${cellBorder}`}>
                {cuposStr}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
