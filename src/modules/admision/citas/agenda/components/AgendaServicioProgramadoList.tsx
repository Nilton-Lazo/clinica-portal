import * as React from "react";
import type { AgendaEspecialidadOption } from "../types/agendaMedica.types";

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
      <div className="flex items-center justify-center rounded-md border border-(--border-color-default) bg-(--color-surface) py-3 px-4">
        <span className="text-xs text-(--color-text-secondary)">Cargando servicios…</span>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-md border border-(--border-color-default) bg-(--color-surface) py-3 px-4">
        <span className="text-xs text-(--color-text-secondary)">{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-md border border-(--border-color-default) bg-(--color-surface)">
      <div className="max-h-[320px] min-h-0 overflow-x-hidden overflow-y-auto app-scrollbar">
        <table className="w-full border-collapse text-left text-xs" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "4rem" }} />
            <col style={{ width: "auto" }} />
            <col style={{ width: "4rem" }} />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-(--color-panel-context)">
            <tr>
              <th className="border-b border-r border-(--border-color-default) px-2 py-2 text-center font-semibold text-(--color-text-secondary)">
                Código
              </th>
              <th className="border-b border-r border-(--border-color-default) px-2 py-2 text-left font-semibold text-(--color-text-secondary)">
                Especialidad
              </th>
              <th className="border-b border-(--border-color-default) px-2 py-2 text-center font-semibold text-(--color-text-secondary)">
                Cupos
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((e) => {
              const isSelected = selectedId === e.id;
              const cupos = e.cupos_disponibles ?? 0;
              const cuposStr = cupos <= 0 ? "00" : String(cupos).padStart(2, "0");
              return (
                <tr
                  key={e.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(e.id)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      onSelect(e.id);
                    }
                  }}
                  className={[
                    "cursor-pointer border-b border-(--border-color-default) transition-colors last:border-b-0",
                    isSelected ? "bg-(--color-panel-options-bg)" : "hover:bg-(--color-panel-options-bg)",
                  ].join(" ")}
                  aria-pressed={isSelected}
                  aria-label={`Seleccionar ${e.codigo} ${e.descripcion}`}
                >
                  <td className="relative border-r border-(--border-color-default) px-2 py-2 text-center tabular-nums text-(--color-text-primary)">
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-(--color-primary)" aria-hidden="true" />}
                    {e.codigo}
                  </td>
                  <td className="truncate border-r border-(--border-color-default) px-2 py-2 text-left text-(--color-text-primary)">
                    {e.descripcion}
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums text-(--color-text-primary)">
                    {cuposStr}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
