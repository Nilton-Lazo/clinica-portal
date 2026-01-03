import { useLocation } from "react-router-dom";
import { ROUTE_META } from "./routeMeta.registry";

export function useRouteMeta() {
  const { pathname } = useLocation();
  return ROUTE_META[pathname] ?? null;
}
