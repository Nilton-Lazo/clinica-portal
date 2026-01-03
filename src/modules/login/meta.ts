import type { RouteMeta } from "../../app/router/routeMeta.types";

export const authMeta: Record<string, RouteMeta> = {
  "/login": {
    title: "Iniciar sesión",
    subtitle: "Acceso al sistema",
    breadcrumb: [{ label: "Login" }],
  },
};
