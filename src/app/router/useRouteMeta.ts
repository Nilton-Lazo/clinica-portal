import { matchPath, useLocation } from "react-router-dom";
import { ROUTE_META_ENTRIES } from "./routeMeta.registry";

function normalizePath(pathname: string) {
  if (pathname.length > 1) {
    return pathname.replace(/\/+$/, "");
  }
  return pathname;
}

export function useRouteMeta() {
  const { pathname } = useLocation();
  const current = normalizePath(pathname);

  for (const [pattern, meta] of ROUTE_META_ENTRIES) {
    const matched = matchPath({ path: pattern, end: true }, current);
    if (matched) return meta;
  }

  for (const [pattern, meta] of ROUTE_META_ENTRIES) {
    const matched = matchPath({ path: pattern, end: false }, current);
    if (matched) return meta;
  }

  return null;
}
