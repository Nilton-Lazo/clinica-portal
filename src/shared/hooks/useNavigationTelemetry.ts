import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useRouteMeta } from "../../app/router/useRouteMeta";
import { navigationService } from "../telemetry/navigation.service";

function normalizePath(pathname: string) {
  if (pathname.length > 1) return pathname.replace(/\/+$/, "");
  return pathname;
}

function getModuleFromPath(path: string) {
  const seg = path.split("/").filter(Boolean)[0];
  return seg ?? "root";
}

export function useNavigationTelemetry(intervalMs: number = 1500) {
  const { user } = useAuth();
  const location = useLocation();
  const meta = useRouteMeta();

  const lastSentRef = useRef<{ path: string; at: number } | null>(null);

  useEffect(() => {
    if (!user) return;

    const path = normalizePath(location.pathname);
    if (path === "/login") return;

    const now = Date.now();
    const last = lastSentRef.current;

    if (last && last.path === path && now - last.at < intervalMs) return;

    lastSentRef.current = { path, at: now };

    void navigationService.track({
      path,
      screen: meta?.title,
      module: getModuleFromPath(path),
    });
  }, [user, location.pathname, meta?.title, intervalMs]);
}
