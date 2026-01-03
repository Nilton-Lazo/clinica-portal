import type { RouteMeta } from "./routeMeta.types";

import { authMeta } from "../../modules/login/meta";
import { facturacionMeta } from "../../modules/facturacion/meta";

export const ROUTE_META: Record<string, RouteMeta> = {
  ...authMeta,
  ...facturacionMeta,
};
