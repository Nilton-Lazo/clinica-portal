import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { authService } from "../../modules/login/services/auth.service";
import { useAuth } from "../auth/useAuth";

type Options = {
  intervalMs?: number;
};

export function useActivityKeepAlive(opts: Options = {}) {
  const { user } = useAuth();
  const location = useLocation();

  const intervalMs = opts.intervalMs ?? 90_000;

  const lastPingAtRef = useRef(0);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    const now = Date.now();
    if (inFlightRef.current) return;
    if (now - lastPingAtRef.current < intervalMs) return;

    inFlightRef.current = true;
    lastPingAtRef.current = now;

    authService
      .keepAlive()
      .catch((err) => {
        void err;
      })
      .finally(() => {
        inFlightRef.current = false;
      });
  }, [user, location.key, intervalMs]);

  useEffect(() => {
    if (!user) return;

    const ping = () => {
      const now = Date.now();
      if (inFlightRef.current) return;
      if (now - lastPingAtRef.current < intervalMs) return;

      inFlightRef.current = true;
      lastPingAtRef.current = now;

      authService
        .keepAlive()
        .catch((err) => {
          void err;
        })
        .finally(() => {
          inFlightRef.current = false;
        });
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") ping();
    };

    window.addEventListener("pointerdown", ping, { passive: true });
    window.addEventListener("keydown", ping);
    window.addEventListener("wheel", ping, { passive: true });
    window.addEventListener("focus", ping);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pointerdown", ping);
      window.removeEventListener("keydown", ping);
      window.removeEventListener("wheel", ping);
      window.removeEventListener("focus", ping);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user, intervalMs]);
}
