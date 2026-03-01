import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useBootstrapAuth } from "../../shared/hooks/useBootstrapAuth";
import { useAuth } from "../../shared/auth/useAuth";
import { sessionEvents } from "../../shared/auth/sessionEvents";
import { useClientContextSync } from "./useClientContextSync";

const LOADING_HINT_AFTER_MS = 5000;

export default function AppBootstrap() {
  const navigate = useNavigate();
  const { isLoading, setUser } = useAuth();
  const [showLoadingHint, setShowLoadingHint] = useState(false);

  useBootstrapAuth();
  useClientContextSync();

  useEffect(() => {
    const off = sessionEvents.onUnauthorized((payload) => {
      setUser(null);
      navigate("/login", {
        replace: true,
        state: payload?.code ? { sessionExpiredCode: payload.code } : undefined,
      });
    });

    return () => {
      off();
    };
  }, [navigate, setUser]);

  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => setShowLoadingHint(true), LOADING_HINT_AFTER_MS);
    return () => clearTimeout(t);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-(--color-app-bg)" role="status" aria-live="polite">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-(--color-primary) border-t-transparent" aria-hidden />
        <p className="text-sm font-medium text-(--color-text-primary)">Cargando…</p>
        {showLoadingHint && (
          <p className="max-w-[280px] text-center text-xs text-(--color-text-secondary)">
            Si tarda mucho, comprueba tu conexión o actualiza la página.
          </p>
        )}
      </div>
    );
  }

  return <Outlet />;
}
