import type { AgendaMedicoOption } from "../types/agendaMedica.types";

function medicoLabel(m: AgendaMedicoOption): string {
  return `${m.apellido_paterno} ${m.apellido_materno} ${m.nombres}`.trim();
}

const cellBorder = "border-b border-r border-(--border-color-default) last:border-r-0";

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
      <div className="flex min-h-[200px] items-center justify-center rounded-md border border-(--border-color-default) bg-(--color-surface) py-3 px-4">
        <span className="text-xs text-(--color-text-secondary)">Cargando médicos…</span>
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
        <div className="grid min-w-0 grid-cols-[4rem_1fr_4.5rem]">
          {/* Cabecera */}
          <div
            className={`border-b border-r border-(--border-color-default) bg-(--color-panel-context) px-2 py-2 text-center text-xs font-semibold text-(--color-text-secondary) last:border-r-0`}
          >
            Código
          </div>
          <div
            className={`min-w-0 border-b border-r border-(--border-color-default) bg-(--color-panel-context) px-2 py-2 text-left text-xs font-semibold text-(--color-text-secondary) last:border-r-0`}
          >
            Apellidos y Nombres
          </div>
          <div
            className={`min-w-0 border-b border-r border-(--border-color-default) bg-(--color-panel-context) px-2 py-2 text-center text-xs font-semibold text-(--color-text-secondary) last:border-r-0`}
          >
            CMP
          </div>
          {/* Filas */}
          {list.map((m) => {
            const isSelected = selectedId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelect(m.id)}
                className={[
                  "col-span-3 grid min-w-0 grid-cols-[4rem_1fr_4.5rem] text-left text-xs transition-colors",
                  isSelected ? "bg-(--color-panel-options-bg)" : "hover:bg-(--color-panel-options-bg)",
                ].join(" ")}
                aria-pressed={isSelected}
                aria-label={`Seleccionar ${medicoLabel(m)}`}
              >
                <div className={`relative px-2 py-1.5 text-center tabular-nums text-(--color-text-primary) ${cellBorder}`}>
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-(--color-primary)" aria-hidden />
                  )}
                  {m.codigo != null && String(m.codigo).trim() !== "" ? String(m.codigo).trim() : "—"}
                </div>
                <div className={`min-w-0 truncate px-2 py-1.5 text-left text-(--color-text-primary) ${cellBorder}`}>
                  {medicoLabel(m)}
                </div>
                <div
                  className={`flex min-w-0 items-center justify-center px-2 py-1.5 tabular-nums text-(--color-text-secondary) ${cellBorder}`}
                  title={m.cmp ?? undefined}
                >
                  <span className="truncate">{m.cmp ?? "—"}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
