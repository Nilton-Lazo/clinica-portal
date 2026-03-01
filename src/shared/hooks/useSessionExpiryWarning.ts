import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import {
  SESSION_IDLE_MINUTES,
  SESSION_WARN_MINUTES,
} from "../../app/config/session";
import { authService } from "../../modules/login/services/auth.service";
import { useAuth } from "../auth/useAuth";
import { sessionWarningStore } from "../auth/sessionWarningStore";

type State = {
  open: boolean;
  remainingSeconds: number;
  reset: () => void;
};

const KEEP_ALIVE_SYNC_MS = 4 * 60_000;

export function useSessionExpiryWarning(): State {
  const { user } = useAuth();

  const { open, remainingSeconds } = useSyncExternalStore(
    sessionWarningStore.subscribe,
    sessionWarningStore.getSnapshot,
    sessionWarningStore.getSnapshot
  );

  const idleMs = SESSION_IDLE_MINUTES * 60_000;
  const warnMs = SESSION_WARN_MINUTES * 60_000;

  const lastActivityAtRef = useRef<number>(0);
  const lastServerSyncAtRef = useRef<number>(0);
  const syncInFlightRef = useRef(false);
  const warnTimeoutRef = useRef<number | null>(null);
  const tickIntervalRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (warnTimeoutRef.current !== null) {
      window.clearTimeout(warnTimeoutRef.current);
      warnTimeoutRef.current = null;
    }
    if (tickIntervalRef.current !== null) {
      window.clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }, []);

  const schedule = useCallback(() => {
    clearTimers();
    sessionWarningStore.reset();

    const warnAt = idleMs - warnMs;
    if (warnAt <= 0) return;

    warnTimeoutRef.current = window.setTimeout(() => {
      const elapsed = Date.now() - lastActivityAtRef.current;
      if (elapsed < idleMs - warnMs) return;

      sessionWarningStore.set({ open: true });

      const tick = () => {
        const e = Date.now() - lastActivityAtRef.current;
        const remaining = Math.max(0, idleMs - e);
        sessionWarningStore.set({
          remainingSeconds: Math.ceil(remaining / 1000),
        });
      };

      tick();
      tickIntervalRef.current = window.setInterval(tick, 1000);
    }, warnAt);
  }, [clearTimers, idleMs, warnMs]);

  const syncServerActivity = useCallback(
    async (force = false) => {
      if (!user) return;
      if (syncInFlightRef.current) return;

      const now = Date.now();
      if (!force && now - lastServerSyncAtRef.current < KEEP_ALIVE_SYNC_MS) return;

      syncInFlightRef.current = true;
      try {
        await authService.keepAlive();
        lastServerSyncAtRef.current = Date.now();
      } catch {
        // HttpClient ya emite unauthorized en 401; aquí evitamos ruido.
      } finally {
        syncInFlightRef.current = false;
      }
    },
    [user]
  );

  const markActivity = useCallback(() => {
    if (sessionWarningStore.getSnapshot().open) return;

    lastActivityAtRef.current = Date.now();
    schedule();
    void syncServerActivity();
  }, [schedule, syncServerActivity]);

  const reset = useCallback(() => {
    lastActivityAtRef.current = Date.now();
    lastServerSyncAtRef.current = Date.now();
    sessionWarningStore.reset();
    schedule();
  }, [schedule]);

  useEffect(() => {
    clearTimers();
    sessionWarningStore.reset();

    if (!user) return;

    lastActivityAtRef.current = Date.now();
    lastServerSyncAtRef.current = Date.now();
    schedule();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        markActivity();
        void syncServerActivity(true);
      }
    };

    window.addEventListener("pointerdown", markActivity, { passive: true });
    window.addEventListener("keydown", markActivity);
    window.addEventListener("wheel", markActivity, { passive: true });
    window.addEventListener("focus", markActivity);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pointerdown", markActivity);
      window.removeEventListener("keydown", markActivity);
      window.removeEventListener("wheel", markActivity);
      window.removeEventListener("focus", markActivity);
      document.removeEventListener("visibilitychange", onVisibility);

      clearTimers();
      sessionWarningStore.reset();
    };
  }, [user, clearTimers, schedule, markActivity, syncServerActivity]);

  return { open, remainingSeconds, reset };
}
