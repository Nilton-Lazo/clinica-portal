import * as React from "react";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { useAuth } from "../auth/useAuth";
import { tokenStore } from "../api/tokenStore";
import { dispatchRealtimeEntityChanged, type RealtimeEntityChangedEvent } from "./realtimeEvents";

type EchoClient = Echo<"pusher">;

function buildAuthEndpoint(): string {
  const base = String(import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
  if (!base) return "/api/broadcasting/auth";
  return `${base}/broadcasting/auth`;
}

function shouldEnableRealtime(): boolean {
  const key = String(import.meta.env.VITE_PUSHER_APP_KEY ?? "").trim();
  return key !== "";
}

function isRealtimeDebugEnabled(): boolean {
  return String(import.meta.env.VITE_REALTIME_DEBUG ?? "").trim() === "true";
}

function createEcho(): EchoClient {
  const host = String(import.meta.env.VITE_PUSHER_HOST ?? "").trim();
  const port = Number(import.meta.env.VITE_PUSHER_PORT ?? 443);
  const cluster = String(import.meta.env.VITE_PUSHER_APP_CLUSTER ?? "mt1");
  const token = tokenStore.get();
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  window.Pusher = Pusher;
  if (isRealtimeDebugEnabled()) {
    Pusher.logToConsole = true;
    console.info("[realtime] Configuracion", {
      cluster,
      host: host || "pusher-managed",
      authEndpoint: buildAuthEndpoint(),
      hasToken: Boolean(token),
    });
  }

  const options: ConstructorParameters<typeof Echo<"pusher">>[0] = {
    broadcaster: "pusher",
    key: String(import.meta.env.VITE_PUSHER_APP_KEY ?? ""),
    cluster,
    forceTLS: true,
    authEndpoint: buildAuthEndpoint(),
    auth: {
      headers: authHeaders,
    },
    channelAuthorization: {
      endpoint: buildAuthEndpoint(),
      transport: "ajax",
      headers: authHeaders,
    },
  };

  if (host) {
    options.wsHost = host;
    options.wssPort = port;
  }

  return new Echo(options);
}

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  React.useEffect(() => {
    const debug = isRealtimeDebugEnabled();

    if (!user || !shouldEnableRealtime()) {
      if (debug && user) {
        console.info("[realtime] Deshabilitado: falta VITE_PUSHER_APP_KEY.");
      }
      return;
    }

    const echo = createEcho();
    const channel = echo.private("system");

    if (debug) {
      const connector = echo.connector as unknown as {
        pusher?: {
          connection?: {
            bind: (event: string, callback: (payload: unknown) => void) => void;
          };
        };
      };

      console.info("[realtime] Conectando a canal privado system.");
      connector.pusher?.connection?.bind("state_change", (state) => {
        console.info("[realtime] Estado conexion", state);
      });
      connector.pusher?.connection?.bind("error", (error) => {
        console.error("[realtime] Error conexion", error);
      });
    }

    channel.subscribed(() => {
      if (debug) {
        console.info("[realtime] Suscripcion privada system OK.");
      }
    });

    if (debug) {
      (channel as unknown as {
        listenToAll: (callback: (event: string, payload: unknown) => void) => void;
      }).listenToAll((event, payload) => {
        console.info("[realtime] Evento raw recibido", { event, payload });
      });
    }

    channel.error((error: unknown) => {
      if (debug) {
        console.error("[realtime] Error suscripcion privada system", error);
      }
    });

    channel.listen(".system.entity.changed", (payload: RealtimeEntityChangedEvent) => {
      if (debug) {
        console.info("[realtime] Evento recibido", payload);
      }
      dispatchRealtimeEntityChanged(payload);
    });

    return () => {
      echo.leave("private-system");
      echo.disconnect();
    };
  }, [user]);

  return <>{children}</>;
}
