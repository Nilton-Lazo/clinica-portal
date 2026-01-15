import type { Consultorio, PaginatedResponse } from "../../types/consultorios.types";
import { StatusBadge } from "../../components/StatusBadge";

export default function ConsultoriosTable(props: {
  data: PaginatedResponse<Consultorio>;
  loading: boolean;
  selectedId: number | null;
  onSelect: (x: Consultorio) => void;
  page: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { data, loading, selectedId, onSelect, page, onPrev, onNext } = props;

  return (
    <div className="hidden h-full min-h-0 flex-col lg:flex">
      <div className="rounded-2xl border border-(--border-color-default) overflow-hidden bg-(--color-surface)">
        <div className="min-h-0 overflow-auto app-scrollbar app-scrollbar-no-gutter">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-(--color-primary) text-(--color-text-inverse)">
              <tr>
                <th className="px-3 py-2 text-center font-semibold w-40 bg-(--color-primary)">
                  Abreviatura
                </th>
                <th className="px-3 py-2 text-left font-semibold bg-(--color-primary)">
                  Descripción de Consultorio
                </th>
                <th className="px-3 py-2 text-center font-semibold w-44 bg-(--color-primary)">
                  Estado
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-3 text-(--color-text-secondary)" colSpan={3}>
                    Cargando…
                  </td>
                </tr>
              ) : data.data.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-(--color-text-secondary)" colSpan={3}>
                    No hay registros.
                  </td>
                </tr>
              ) : (
                data.data.map((x) => {
                  const active = selectedId === x.id;
                  return (
                    <tr
                      key={x.id}
                      onClick={() => onSelect(x)}
                      className={[
                        "cursor-pointer border-t border-(--border-color-default) transition-colors",
                        active ? "bg-(--color-surface-hover)" : "bg-(--color-surface)",
                        "hover:bg-(--color-surface-hover)",
                      ].join(" ")}
                    >
                      <td className="px-3 py-2 text-center tabular-nums">{x.abreviatura}</td>
                      <td className="px-3 py-2">{x.descripcion}</td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex justify-center">
                          <StatusBadge status={x.estado} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-(--color-text-secondary)">
        <div>
          Mostrando{" "}
          {data.meta.total === 0 ? 0 : (data.meta.current_page - 1) * data.meta.per_page + 1} –{" "}
          {Math.min(data.meta.current_page * data.meta.per_page, data.meta.total)} de {data.meta.total}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-9 rounded-xl px-3 bg-(--color-panel-context) text-(--color-base-primary) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            disabled={page <= 1}
            onClick={onPrev}
          >
            Anterior
          </button>
          <div>
            Página {data.meta.current_page} / {data.meta.last_page}
          </div>
          <button
            type="button"
            className="h-9 rounded-xl px-3 bg-(--color-panel-context) text-(--color-base-primary) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            disabled={page >= data.meta.last_page}
            onClick={onNext}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
