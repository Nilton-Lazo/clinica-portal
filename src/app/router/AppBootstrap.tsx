import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useBootstrapAuth } from "../../shared/hooks/useBootstrapAuth";
import { useAuth } from "../../shared/auth/useAuth";
import { sessionEvents } from "../../shared/auth/sessionEvents";
import { useClientContextSync } from "./useClientContextSync";
import SessionExpiryController from "../../shared/ui/SessionExpiryController";

export default function AppBootstrap() {
  const navigate = useNavigate();
  const { isLoading, setUser } = useAuth();

  useBootstrapAuth();
  useClientContextSync();

  useEffect(() => {
    const off = sessionEvents.onUnauthorized(() => {
      setUser(null);
      navigate("/login", { replace: true });
    });

    return () => {
      off();
    };
  }, [navigate, setUser]);

  if (isLoading) {
    return <div className="min-h-dvh bg-zinc-100" />;
  }

  return (
    <>
      <SessionExpiryController />
      <Outlet />
    </>
  );
}
