import * as React from "react";
import type { AgendaMedicoOption } from "../types/agendaMedica.types";

function medicoLabel(m: AgendaMedicoOption): string {
  return `${m.apellido_paterno} ${m.apellido_materno} ${m.nombres}`.trim();
}

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
      <div className="flex items-center justify-center rounded-md border border-(--border-color-default) bg-(--color-surface) py-3 px-4">
        <span className="text-xs text-(--color-text-secondary)">Cargando médicos…</span>
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
            <col style={{ width: "4.5rem" }} />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-(--color-panel-context)">
            <tr>
              <th className="border-b border-r border-(--border-color-default) px-2 py-2 text-center font-semibold text-(--color-text-secondary)">
                Código
              </th>
              <th className="border-b border-r border-(--border-color-default) px-2 py-2 text-left font-semibold text-(--color-text-secondary)">
                Apellidos y Nombres
              </th>
              <th className="border-b border-(--border-color-default) px-2 py-2 text-center font-semibold text-(--color-text-secondary)">
                CMP
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => {
              const isSelected = selectedId === m.id;
              return (
                <tr
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(m.id)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      onSelect(m.id);
                    }
                  }}
                  className={[
                    "cursor-pointer border-b border-(--border-color-default) transition-colors last:border-b-0",
                    isSelected ? "bg-(--color-panel-options-bg)" : "hover:bg-(--color-panel-options-bg)",
                  ].join(" ")}
                  aria-pressed={isSelected}
                  aria-label={`Seleccionar ${medicoLabel(m)}`}
                >
                  <td className="relative border-r border-(--border-color-default) px-2 py-2 text-center tabular-nums text-(--color-text-primary)">
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-(--color-primary)" aria-hidden="true" />}
                    {m.codigo != null && String(m.codigo).trim() !== "" ? String(m.codigo).trim() : "—"}
                  </td>
                  <td className="truncate border-r border-(--border-color-default) px-2 py-2 text-left text-(--color-text-primary)">
                    {medicoLabel(m)}
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums text-(--color-text-secondary)">
                    {m.cmp ?? "—"}
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
