import { NavLink, useLocation, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

type Item = { label: string; to: string; disabled?: boolean };
type Group = { label: string; items: Item[] };

export function TarifarioNavTree({
  tarifaLabel,
  onNavigate,
}: {
  tarifaLabel: string;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  const tarifaId = searchParams.get("tarifaId");
  const tarifaLabelParam = searchParams.get("tarifaLabel") ?? tarifaLabel;

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    if (tarifaId) params.set("tarifaId", tarifaId);
    if (tarifaLabelParam) params.set("tarifaLabel", tarifaLabelParam);
    const s = params.toString();
    return s ? `?${s}` : "";
  }, [tarifaId, tarifaLabelParam]);

  const groups: Group[] = useMemo(
    () => [
      {
        label: tarifaLabelParam || "Tarifario",
        items: [
          { label: "Categorías", to: `/facturacion/tarifario/gestion/categorias${qs}` },
          { label: "Subcategorías", to: `/facturacion/tarifario/gestion/subcategorias${qs}` },
          { label: "Servicios", to: `/facturacion/tarifario/gestion/servicios${qs}` },
        ],
      },
    ],
    [tarifaLabelParam, qs]
  );

  const activeGroupLabel = useMemo(() => {
    for (const g of groups) {
      if (g.items.some((it) => pathname.startsWith(it.to.split("?")[0]))) return g.label;
    }
    return groups[0]?.label ?? "";
  }, [pathname, groups]);

  const [openByLabel, setOpenByLabel] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-2">
      {groups.map((g) => {
        const isActiveGroup = g.label === activeGroupLabel;
        const open = openByLabel[g.label] ?? isActiveGroup;

        return (
          <div key={g.label} className="rounded-2xl">
            <button
              type="button"
              onClick={() =>
                setOpenByLabel((prev) => ({
                  ...prev,
                  [g.label]: !(prev[g.label] ?? isActiveGroup),
                }))
              }
              className={[
                "flex w-full items-center justify-between rounded-xl px-2 py-2 text-left",
                "text-sm font-semibold text-(--color-text-primary)",
                "hover:bg-(--color-surface-hover) transition-colors",
              ].join(" ")}
              aria-expanded={open}
            >
              <span className="min-w-0 truncate">{g.label}</span>
              {open ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-(--color-text-secondary)" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-(--color-text-secondary)" />
              )}
            </button>

            <div
              className={[
                "grid transition-[grid-template-rows] duration-200 ease-out",
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              ].join(" ")}
            >
              <div className="overflow-hidden">
                <div className="mt-1 space-y-1 pl-2">
                  {g.items.map((it) =>
                    it.disabled ? (
                      <div
                        key={it.to}
                        className="cursor-not-allowed rounded-md px-3 py-2 text-sm text-(--color-text-secondary) opacity-50"
                      >
                        {it.label}
                      </div>
                    ) : (
                      <NavLink
                        key={it.to}
                        to={it.to}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          [
                            "block rounded-md px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-(--color-primary) text-(--color-text-inverse)"
                              : "text-(--color-text-primary) hover:bg-(--color-surface-hover)",
                          ].join(" ")
                        }
                      >
                        {it.label}
                      </NavLink>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
