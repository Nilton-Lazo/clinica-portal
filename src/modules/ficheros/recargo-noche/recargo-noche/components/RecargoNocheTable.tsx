import type { RecargoNocheRegla } from "../../services/recargoNoche.service";
import { StatusBadge } from "../../components/StatusBadge";

export default function RecargoNocheTable(props: {
  reglas: RecargoNocheRegla[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (r: RecargoNocheRegla) => void;
}) {
  const { reglas, loading, selectedId, onSelect } = props;

  return (
    <div className="hidden h-full min-h-0 flex-col lg:flex">
      <div className="flex-1 min-h-0 rounded-2xl border border-(--border-color-default) overflow-hidden bg-(--color-surface)">
        <div className="h-full min-h-0 overflow-auto app-scrollbar app-scrollbar-no-gutter">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-(--color-primary) text-(--color-text-inverse)">
              <tr>
                <th className="px-3 py-2 text-center font-semibold w-20 bg-(--color-primary)">Código</th>
                <th className="px-3 py-2 text-left font-semibold bg-(--color-primary)">Categoría</th>
                <th className="px-3 py-2 text-center font-semibold w-24 bg-(--color-primary)">%</th>
                <th className="px-3 py-2 text-center font-semibold w-28 bg-(--color-primary)">H. desde</th>
                <th className="px-3 py-2 text-center font-semibold w-28 bg-(--color-primary)">H. hasta</th>
                <th className="px-3 py-2 text-center font-semibold w-28 bg-(--color-primary)">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-3 text-(--color-text-secondary)" colSpan={6}>
                    Cargando…
                  </td>
                </tr>
              ) : reglas.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-(--color-text-secondary)" colSpan={6}>
                    No hay registros.
                  </td>
                </tr>
              ) : (
                reglas.map((r) => {
                  const active = selectedId === r.id;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => onSelect(r)}
                      className={[
                        "cursor-pointer border-t border-(--border-color-default) transition-colors",
                        active ? "bg-(--color-surface-hover)" : "bg-(--color-surface)",
                        "hover:bg-(--color-surface-hover)",
                      ].join(" ")}
                    >
                      <td className="px-3 py-2 text-center tabular-nums">{r.categoria_codigo ?? "—"}</td>
                      <td className="px-3 py-2 min-w-0">{r.categoria_nombre ?? `Categoría ${r.tarifa_categoria_id}`}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{r.porcentaje}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{r.hora_desde?.slice(0, 5) ?? "—"}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{r.hora_hasta?.slice(0, 5) ?? "—"}</td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex justify-center">
                          <StatusBadge status={r.estado} />
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
    </div>
  );
}
