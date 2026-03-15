import type { RouteMeta } from "../../app/router/routeMeta.types";

export const emergenciaMeta: Record<string, RouteMeta> = {
  "/emergencia": {
    title: "Emergencia",
    subtitle: "Módulo de emergencias.",
    breadcrumb: [{ label: "Emergencia" }],
  },
  "/emergencia/registro": {
    title: "Emergencia",
    subtitle: "Registro de Emergencia",
    breadcrumb: [
      { label: "Emergencia", path: "/emergencia" },
      { label: "Registro de Emergencia" },
    ],
  },
  "/emergencia/registro/nuevo": {
    title: "Emergencia",
    subtitle: "Nuevo registro",
    breadcrumb: [
      { label: "Emergencia", path: "/emergencia" },
      { label: "Registro de Emergencia", path: "/emergencia/registro" },
      { label: "Nuevo registro" },
    ],
  },
  "/emergencia/atencion/:id": {
    title: "Emergencia",
    subtitle: "Atención de Emergencia",
    breadcrumb: [
      { label: "Emergencia", path: "/emergencia" },
      { label: "Registro de Emergencia", path: "/emergencia/registro" },
      { label: "Atención" },
    ],
  },
};
