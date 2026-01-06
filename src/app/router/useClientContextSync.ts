import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useRouteMeta } from "./useRouteMeta";
import { clientContext } from "../../shared/telemetry/clientContext";

function normalizePath(pathname: string) {
  if (pathname.length > 1) return pathname.replace(/\/+$/, "");
  return pathname;
}

export function useClientContextSync() {
  const location = useLocation();
  const meta = useRouteMeta();

  useEffect(() => {
    clientContext.set({
      path: normalizePath(location.pathname),
      screen: meta?.title,
    });
  }, [location.pathname, meta?.title]);
}
