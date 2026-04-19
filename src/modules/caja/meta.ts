import type { RouteMeta } from "../../app/router/routeMeta.types";

export const cajaMeta: Record<string, RouteMeta> = {
  "/caja": {
    title: "Caja",
    subtitle:
      "Gestión de operaciones de caja, aperturas, arqueos y movimientos según las políticas del establecimiento.",
    breadcrumb: [{ label: "Caja" }],
  },
  "/caja/apertura": {
    title: "Caja",
    subtitle: "Registro de apertura, saldo inicial y turno de caja.",
    breadcrumb: [
      { label: "Caja", path: "/caja" },
      { label: "Apertura de caja" },
    ],
  },
  "/caja/emision-comprobantes": {
    title: "Caja",
    subtitle: "Emisión de comprobantes de pago.",
    breadcrumb: [
      { label: "Caja", path: "/caja" },
      { label: "Emisión de comprobantes" },
    ],
  },
  "/caja/reporte-ingresos": {
    title: "Caja",
    subtitle: "Reporte de ingresos de caja.",
    breadcrumb: [
      { label: "Caja", path: "/caja" },
      { label: "Reporte de ingresos" },
    ],
  },
};
