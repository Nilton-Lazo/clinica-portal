import { NavLink, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

type Item = { label: string; to: string; disabled?: boolean };
type Group = { label: string; items: Item[] };

const groups: Group[] = [
  {
    label: "Configuración clínica",
    items: [
      { label: "Especialidades", to: "/admision/ficheros/especialidades" },
      { label: "Consultorios", to: "/admision/ficheros/consultorios" },
      { label: "Médicos", to: "/admision/ficheros/medicos"},
      { label: "Turnos", to: "/admision/ficheros/turnos"},
    ],
  },
  {
    label: "Pacientes",
    items: [
      { label: "Estados civiles", to: "/admision/ficheros/estados-civiles", disabled: true },
      { label: "Parentescos", to: "/admision/ficheros/parentescos", disabled: true },
    ],
  },
  {
    label: "Medicamentos",
    items: [
      { label: "Presentaciones", to: "/admision/ficheros/presentaciones", disabled: true },
      { label: "Vías de administración", to: "/admision/ficheros/vias", disabled: true },
    ],
  },
];

export function FicherosNavTree({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();

  const activeGroupLabel = useMemo(() => {
    for (const g of groups) {
      if (g.items.some((it) => pathname.startsWith(it.to))) return g.label;
    }
    return groups[0]?.label ?? "";
  }, [pathname]);

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
                "text-sm font-semibold text-[var(--color-text-primary)]",
                "hover:bg-[var(--color-surface-hover)] transition-colors",
              ].join(" ")}
              aria-expanded={open}
            >
              <span className="min-w-0 truncate">{g.label}</span>
              {open ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" />
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
                        className="cursor-not-allowed rounded-xl px-3 py-2 text-sm text-[var(--color-text-secondary)] opacity-50"
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
                            "block rounded-xl px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-[var(--color-primary)] text-[var(--color-text-inverse)]"
                              : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]",
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
