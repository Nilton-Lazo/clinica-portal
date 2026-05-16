import type { RouteMeta } from "../../app/router/routeMeta.types";

export const facturacionMeta: Record<string, RouteMeta> = {
  "/facturacion": {
    title: "Facturación",
    subtitle: "Gestión integral de comprobantes, tarifas y reportes de facturación clínica.",
    breadcrumb: [{ label: "Facturación" }],
  },
  "/facturacion/tarifario": {
    title: "Tarifario",
    subtitle: "Gestión de servicios por tarifa: precios, nomencladores y unidades.",
    breadcrumb: [{ label: "Facturación", path: "/facturacion" }, { label: "Tarifario" }],
  },
};
