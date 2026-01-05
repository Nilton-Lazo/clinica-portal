import { useEffect } from "react";
import { authService } from "../../modules/login/services/auth.service";
import { useAuth } from "../auth/useAuth";

export function useBootstrapAuth() {
  const { setUser, setLoading } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!authService.hasSession()) {
        setLoading(false);
        return;
      }

      try {
        const user = await authService.me();
        if (!cancelled) {
          setUser(user);
        }
      } catch {
        authService.logout();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [setUser, setLoading]);
}
