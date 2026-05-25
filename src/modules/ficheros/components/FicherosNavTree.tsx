import { NavLink, useLocation } from "react-router-dom";
import { useMemo } from "react";

type ModuleItem = {
  label: string;
  to: string;
  match: string[];
};

const modules: ModuleItem[] = [
  {
    label: "Admisión",
    to: "/ficheros/admision",
    match: [
      "/ficheros/admision",
      "/ficheros/especialidades",
      "/ficheros/consultorios",
      "/ficheros/medicos",
      "/ficheros/turnos",
    ],
  },
  {
    label: "Caja",
    to: "/ficheros/parametros/caja",
    match: [
      "/ficheros/parametros/caja",
      "/ficheros/parametros/igv",
      "/ficheros/parametros/recargo-noche",
    ],
  },
  {
    label: "Facturación",
    to: "/ficheros/facturacion",
    match: [
      "/ficheros/facturacion",
      "/ficheros/tipos-iafas",
      "/ficheros/iafas",
      "/ficheros/contratantes",
      "/ficheros/tarifas",
      "/ficheros/tipos-clientes",
      "/ficheros/clonacion-tarifa",
      "/ficheros/tarifario-categorias",
      "/ficheros/tarifario-subcategorias",
      "/ficheros/paquetes",
      "/ficheros/paquetes-servicios",
      "/ficheros/clientes",
    ],
  },
  {
    label: "Hospitalización",
    to: "/ficheros/parametros/hospitalizacion",
    match: ["/ficheros/parametros/hospitalizacion"],
  },
  {
    label: "Emergencia",
    to: "/ficheros/parametros/emergencia",
    match: ["/ficheros/parametros/emergencia"],
  },
];

export function FicherosNavTree({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();

  const activeModuleLabel = useMemo(() => {
    const active = modules.find((module) =>
      module.match.some((path) => pathname === path || pathname.startsWith(`${path}/`))
    );
    return active?.label ?? modules[0]?.label ?? "";
  }, [pathname]);

  return (
    <nav className="space-y-1" aria-label="Módulos de ficheros">
      {modules.map((module) => {
        const isActive = module.label === activeModuleLabel;

        return (
          <NavLink
            key={module.to}
            to={module.to}
            onClick={onNavigate}
            className={[
              "block rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-l-(--color-primary) bg-(--color-primary)/8 text-(--color-primary)"
                : "border-l-transparent text-(--color-text-primary) hover:bg-(--color-surface-hover) hover:text-(--color-primary)",
            ].join(" ")}
          >
            {module.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
