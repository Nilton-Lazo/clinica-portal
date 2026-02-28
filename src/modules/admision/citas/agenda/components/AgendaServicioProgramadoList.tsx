import * as React from "react";
import type { AgendaEspecialidadOption } from "../types/agendaMedica.types";

/** Un solo grid (cabecera + filas) dentro del scroll: las columnas quedan siempre alineadas. */
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
      <div className="flex min-h-[200px] items-center justify-center rounded-md border border-(--border-color-default) bg-(--color-surface) py-3 px-4">
        <span className="text-xs text-(--color-text-secondary)">Cargando servicios…</span>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-md border border-(--border-color-default) bg-(--color-surface) py-3 px-4">
        <span className="text-xs text-(--color-text-secondary)">{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-md border border-(--border-color-default) bg-(--color-surface)">
      <div className="max-h-[320px] min-h-0 overflow-hidden">
        <div className={`grid min-w-0 ${gridCols}`}>
          {/* Cabecera */}
          <div
            className={`border-b border-r border-(--border-color-default) bg-(--color-panel-context) px-2 py-2 text-center text-xs font-semibold text-(--color-text-secondary) last:border-r-0`}
          >
            Código
          </div>
          <div
            className={`min-w-0 border-b border-r border-(--border-color-default) bg-(--color-panel-context) px-2 py-2 text-left text-xs font-semibold text-(--color-text-secondary) last:border-r-0`}
          >
            Especialidad
          </div>
          <div
            className={`min-w-0 border-b border-r border-(--border-color-default) bg-(--color-panel-context) px-2 py-2 text-center text-xs font-semibold text-(--color-text-secondary) last:border-r-0`}
          >
            Cupos
          </div>
          {/* Filas: cada botón ocupa las 3 columnas y dentro repite el mismo grid para alinear */}
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
                  "col-span-3 grid min-w-0 grid-cols-[4rem_1fr_4.5rem] text-left text-xs transition-colors",
                  isSelected ? "bg-(--color-panel-options-bg)" : "hover:bg-(--color-panel-options-bg)",
                ].join(" ")}
                aria-pressed={isSelected}
                aria-label={`Seleccionar ${e.codigo} ${e.descripcion}`}
              >
                <div className={`relative px-2 py-1.5 text-center tabular-nums text-(--color-text-primary) ${cellBorder}`}>
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-(--color-primary)" aria-hidden />
                  )}
                  {e.codigo}
                </div>
                <div className={`min-w-0 truncate px-2 py-1.5 text-left text-(--color-text-primary) ${cellBorder}`}>
                  {e.descripcion}
                </div>
                <div className={`flex min-w-0 items-center justify-center px-2 py-1.5 tabular-nums text-(--color-text-primary) ${cellBorder}`}>
                  {cuposStr}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
