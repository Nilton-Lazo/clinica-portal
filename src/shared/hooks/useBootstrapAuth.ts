import { useEffect } from "react";
import { authService } from "../../modules/login/services/auth.service";
import { useAuth } from "../auth/useAuth";

/** Tiempo máximo para validar sesión al cargar; evita pantalla en blanco si el backend no responde. */
const BOOTSTRAP_AUTH_TIMEOUT_MS = 15_000;

export function useBootstrapAuth() {
  const { setUser, setLoading } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!authService.hasSession()) {
        setLoading(false);
        return;
      }

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Bootstrap auth timeout")), BOOTSTRAP_AUTH_TIMEOUT_MS);
      });

      try {
        const user = await Promise.race([authService.me(), timeoutPromise]);
        if (!cancelled) {
          setUser(user);
        }
      } catch {
        await authService.logout();
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
