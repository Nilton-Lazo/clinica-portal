import type { RouteMeta } from "./routeMeta.types";

import { authMeta } from "../../modules/login/meta";
import { inicioMeta } from "../../modules/inicio/meta";
import { facturacionMeta } from "../../modules/facturacion/meta";

export const ROUTE_META: Record<string, RouteMeta> = {
  ...authMeta,
  ...inicioMeta,
  ...facturacionMeta,
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
