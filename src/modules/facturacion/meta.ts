import type { RouteMeta } from "../../app/router/routeMeta.types";

export const facturacionMeta: Record<string, RouteMeta> = {
  "/facturacion": {
    title: "Facturación",
    subtitle: "Gestión integral de comprobantes, tarifas y reportes de facturación clínica.",
    breadcrumb: [{ label: "Facturación" }],
  },
  "/facturacion/tarifario": {
    title: "Tarifario",
    subtitle: "Gestión de tarifas, categorías, subcategorías y servicios.",
    breadcrumb: [{ label: "Facturación", path: "/facturacion" }, { label: "Tarifario" }],
  },
  "/facturacion/tarifario/gestion/categorias": {
    title: "Tarifario",
    subtitle: "Gestión de categorías del tarifario.",
    breadcrumb: [
      { label: "Facturación", path: "/facturacion" },
      { label: "Tarifario", path: "/facturacion/tarifario" },
      { label: "Categorías" },
    ],
  },
  "/facturacion/tarifario/gestion/subcategorias": {
    title: "Tarifario",
    subtitle: "Gestión de subcategorías del tarifario.",
    breadcrumb: [
      { label: "Facturación", path: "/facturacion" },
      { label: "Tarifario", path: "/facturacion/tarifario" },
      { label: "Subcategorías" },
    ],
  },
  "/facturacion/tarifario/gestion/servicios": {
    title: "Tarifario",
    subtitle: "Gestión de servicios del tarifario.",
    breadcrumb: [
      { label: "Facturación", path: "/facturacion" },
      { label: "Tarifario", path: "/facturacion/tarifario" },
      { label: "Servicios" },
    ],
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
