import type { RouteMeta } from "./routeMeta.types";

import { authMeta } from "../../modules/login/meta";
import { inicioMeta } from "../../modules/inicio/meta";
import { facturacionMeta } from "../../modules/facturacion/meta";
import { admisionMeta } from "../../modules/admision/meta";
import { ficherosMeta } from "../../modules/ficheros/meta";

const comingSoonMeta: Record<string, RouteMeta> = {
  "/caja":                { title: "Caja",                subtitle: "Módulo en desarrollo", breadcrumb: [{ label: "Caja" }] },
  "/caja/*":              { title: "Caja",                subtitle: "Módulo en desarrollo", breadcrumb: [{ label: "Caja" }] },
  "/farmacia":            { title: "Farmacia",            subtitle: "Módulo en desarrollo", breadcrumb: [{ label: "Farmacia" }] },
  "/farmacia/*":          { title: "Farmacia",            subtitle: "Módulo en desarrollo", breadcrumb: [{ label: "Farmacia" }] },
  "/hospital":            { title: "Hospital",            subtitle: "Módulo en desarrollo", breadcrumb: [{ label: "Hospital" }] },
  "/hospital/*":          { title: "Hospital",            subtitle: "Módulo en desarrollo", breadcrumb: [{ label: "Hospital" }] },
  "/diagnostico-clinico": { title: "D. clínico",         subtitle: "Módulo en desarrollo", breadcrumb: [{ label: "D. clínico" }] },
  "/diagnostico-clinico/*":{ title: "D. clínico",        subtitle: "Módulo en desarrollo", breadcrumb: [{ label: "D. clínico" }] },
  "/gerencia":            { title: "Gerencia",            subtitle: "Módulo en desarrollo", breadcrumb: [{ label: "Gerencia" }] },
  "/gerencia/*":          { title: "Gerencia",            subtitle: "Módulo en desarrollo", breadcrumb: [{ label: "Gerencia" }] },
  "/seguridad":           { title: "Seguridad",           subtitle: "Módulo en desarrollo", breadcrumb: [{ label: "Seguridad" }] },
  "/seguridad/*":         { title: "Seguridad",           subtitle: "Módulo en desarrollo", breadcrumb: [{ label: "Seguridad" }] },
};

export const ROUTE_META: Record<string, RouteMeta> = {
  ...authMeta,
  ...inicioMeta,
  ...facturacionMeta,
  ...admisionMeta,
  ...ficherosMeta,
  ...comingSoonMeta,
};

type Entry = [pattern: string, meta: RouteMeta];

function scorePattern(pattern: string): number {
  const segments = pattern.split("/").filter(Boolean);

  let score = 0;
  for (const seg of segments) {
    if (seg === "*") score -= 10;
    else if (seg.startsWith(":")) score += 1;
    else score += 5;
  }

  score += segments.length;
  return score;
}

export const ROUTE_META_ENTRIES: Entry[] = Object.entries(ROUTE_META).sort(
  (a, b) => scorePattern(b[0]) - scorePattern(a[0])
);
