import * as React from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../modules/login/services/auth.service";
import { useAuth } from "../auth/useAuth";
import { useSessionExpiryWarning } from "../hooks/useSessionExpiryWarning";
import SessionExpiryWarning from "./SessionExpiryWarning";

export default function SessionExpiryController() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { open, remainingSeconds, reset } = useSessionExpiryWarning();

  const onLogout = React.useCallback(async () => {
    await authService.logout();
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate, setUser]);

  const onContinue = React.useCallback(async () => {
    try {
      await authService.keepAlive();
      reset();
    } catch (err) {
      void err;
    }
  }, [reset]);

  React.useEffect(() => {
    if (!user) return;
    if (!open) return;
    if (remainingSeconds > 0) return;

    const t = window.setTimeout(() => {
      void onLogout();
    }, 0);

    return () => window.clearTimeout(t);
  }, [user, open, remainingSeconds, onLogout]);

  if (!user) return null;

  return (
    <SessionExpiryWarning
      open={open}
      remainingSeconds={remainingSeconds}
      onContinue={onContinue}
      onLogout={onLogout}
    />
  );
}
