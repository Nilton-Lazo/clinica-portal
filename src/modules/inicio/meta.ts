import type { RouteMeta } from "../../app/router/routeMeta.types";

export const inicioMeta: Record<string, RouteMeta> = {
  "/inicio": {
    title: "Inicio",
    subtitle: "Panel principal",
    breadcrumb: [{ label: "Inicio", path: "/inicio" }],
  },
};