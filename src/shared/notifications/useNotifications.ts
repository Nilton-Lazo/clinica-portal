import * as React from "react";
import {
  notificationService,
  type UserNotification,
} from "./notificationService";
import {
  NOTIFICATION_REFRESH_EVENT,
  type NotificationRefreshDetail,
} from "./toastService";

const POLL_INTERVAL_MS = 20_000; // refresca cada 20 segundos como respaldo

export type UseNotificationsResult = {
  notifications: UserNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  reload: () => void;
};

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = React.useState<UserNotification[]>(
    []
  );
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const fetch = React.useCallback(async (silent = false): Promise<UserNotification[]> => {
    if (!silent) setLoading(true);
    try {
      const res = await notificationService.list(false, 30);
      setNotifications(res.data);
      setUnreadCount(res.meta.unread_count);
      return res.data;
    } catch {
      // silencioso — no queremos romper la UI si el endpoint no está disponible aún
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Carga inicial + polling de respaldo + recarga inmediata por evento
  React.useEffect(() => {
    void fetch();

    // Polling de respaldo (20 s) por si el evento no llega
    const pollId = setInterval(() => void fetch(true), POLL_INTERVAL_MS);

    // Recarga inmediata cuando toastService.showSuccess() dispara la acción.
    // Además, marca como leídas notificaciones nuevas de acción (ya vistas en toast).
    const onAction = (event: Event) => {
      const customEvent = event as CustomEvent<NotificationRefreshDetail>;
      const occurredAt = customEvent.detail?.occurredAt ?? Date.now();

      void (async () => {
        const fresh = await fetch(true);

        // Si el usuario ya vio el éxito en toast, no lo dejamos como "pendiente".
        const autoReadTargets = fresh.filter((n) => {
          if (n.read_at) return false;
          if (n.type === "error") return false;
          const createdAt = new Date(n.created_at).getTime();
          return Math.abs(createdAt - occurredAt) <= 15_000;
        });

        if (autoReadTargets.length > 0) {
          await Promise.allSettled(
            autoReadTargets.map((n) => notificationService.markAsRead(n.id))
          );

          const idSet = new Set(autoReadTargets.map((n) => n.id));
          const nowIso = new Date().toISOString();
          setNotifications((prev) =>
            prev.map((n) => (idSet.has(n.id) ? { ...n, read_at: n.read_at ?? nowIso } : n))
          );
          setUnreadCount((c) => Math.max(0, c - autoReadTargets.length));
        }

        // Segundo pull corto de respaldo (eventual consistency)
        setTimeout(() => void fetch(true), 1200);
      })();
    };
    window.addEventListener(NOTIFICATION_REFRESH_EVENT, onAction);

    // Refresca cuando la pestaña vuelve a ser visible
    const onVisible = () => {
      if (document.visibilityState === "visible") void fetch(true);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(pollId);
      window.removeEventListener(NOTIFICATION_REFRESH_EVENT, onAction);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetch]);

  const markAsRead = React.useCallback(
    async (id: number) => {
      try {
        await notificationService.markAsRead(id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, read_at: new Date().toISOString() } : n
          )
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // silencioso
      }
    },
    []
  );

  const markAllAsRead = React.useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      // silencioso
    }
  }, []);

  const reload = React.useCallback(() => void fetch(), [fetch]);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, reload };
}
