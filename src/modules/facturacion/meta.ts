import type { RouteMeta } from "../../app/router/routeMeta.types";

export const facturacionMeta: Record<string, RouteMeta> = {
  "/facturacion": {
    title: "Facturación",
    subtitle: "Gestión de procesos de facturación",
    breadcrumb: [{ label: "Facturación" }],
  },

//   "/facturacion/entidades-contratos/tarifarios/crear": {
//     title: "Crear Tarifario",
//     subtitle: "Registro de nuevo tarifario",
//     breadcrumb: [
//       { label: "Facturación", path: "/facturacion" },
//       { label: "Entidades y Contratos", path: "/facturacion/entidades-contratos" },
//       { label: "Crear Tarifario" },
//     ],
//   },
};
