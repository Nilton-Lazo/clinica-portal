import * as React from "react";
import type { AgendaMedicoOption } from "../types/agendaMedica.types";

function medicoLabel(m: AgendaMedicoOption): string {
  return `${m.apellido_paterno} ${m.apellido_materno} ${m.nombres}`.trim();
}

const cellBorder = "border-b border-r border-(--border-color-default) last:border-r-0";

const gridCols = "grid-cols-[4rem_1fr_4.5rem]";

export default function AgendaMedicoProgramadoList({
  list,
  selectedId,
  onSelect,
  loading,
  emptyMessage = "Seleccione un servicio para ver médicos",
}: {
  list: AgendaMedicoOption[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  loading: boolean;
  emptyMessage?: string;
}) {
  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center border border-(--border-color-default) bg-(--color-surface) p-4">
        <span className="text-sm text-(--color-text-secondary)">Cargando médicos…</span>
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
        <div className={`min-w-16 px-2 py-2 text-center text-xs font-semibold text-(--color-text-secondary) ${cellBorder}`}>
          Código
        </div>
        <div className={`px-2 py-2 text-left text-xs font-semibold text-(--color-text-secondary) ${cellBorder}`}>
          Apellidos y Nombres
        </div>
        <div className={`px-2 py-2 text-center text-xs font-semibold text-(--color-text-secondary) ${cellBorder}`}>
          CMP
        </div>
      </div>
      <div className="max-h-[280px] overflow-y-auto">
        {list.map((m) => {
          const isSelected = selectedId === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m.id)}
              className={[
                `grid w-full ${gridCols} text-left transition-colors`,
                isSelected
                  ? "bg-(--color-panel-options-bg) ring-1 ring-(--color-primary)"
                  : "hover:bg-(--color-panel-options-bg)",
              ].join(" ")}
              aria-pressed={isSelected}
              aria-label={`Seleccionar ${medicoLabel(m)}`}
            >
              <div className={`min-w-16 px-2 py-2 text-center text-sm tabular-nums text-(--color-text-primary) ${cellBorder}`}>
                {m.codigo != null && String(m.codigo).trim() !== "" ? String(m.codigo).trim() : "—"}
              </div>
              <div className={`min-w-0 px-2 py-2 text-left text-sm text-(--color-text-primary) truncate ${cellBorder}`}>
                {medicoLabel(m)}
              </div>
              <div className={`min-w-0 px-2 py-2 text-center text-sm tabular-nums text-(--color-text-secondary) truncate ${cellBorder}`} title={m.cmp ?? undefined}>
                {m.cmp ?? "—"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
