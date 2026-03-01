import * as React from "react";
import {
  notificationService,
  type UserNotification,
} from "./notificationService";
import {
  NOTIFICATION_REFRESH_EVENT,
  type NotificationRefreshDetail,
} from "./toastService";

const POLL_INTERVAL_MS = 20_000;
const HISTORY_PAGE_SIZE = 20;

export type UseNotificationsResult = {
  notifications: UserNotification[];
  unreadCount: number;
  totalCount: number;
  pageSize: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loadMore: () => Promise<void>;
  reload: () => void;
};

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = React.useState<UserNotification[]>(
    []
  );
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [lastPage, setLastPage] = React.useState(1);

  const fetchPage = React.useCallback(async (page: number, append: boolean, silent = false): Promise<UserNotification[]> => {
    if (append) setLoadingMore(true);
    else if (!silent) setLoading(true);
    try {
      const res = await notificationService.list(false, HISTORY_PAGE_SIZE, page);
      setNotifications((prev) => {
        if (!append) return res.data;
        const merged = [...prev, ...res.data];
        const uniq = new Map<number, UserNotification>();
        for (const n of merged) uniq.set(n.id, n);
        return Array.from(uniq.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      });
      setUnreadCount(res.meta.unread_count);
      setTotalCount(res.meta.total);
      setCurrentPage(res.meta.current_page);
      setLastPage(res.meta.last_page);
      return res.data;
    } catch {
      return [];
    } finally {
      if (append) setLoadingMore(false);
      else if (!silent) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchPage(1, false);

    const pollId = setInterval(() => void fetchPage(1, false, true), POLL_INTERVAL_MS);

    const onAction = (event: Event) => {
      const customEvent = event as CustomEvent<NotificationRefreshDetail>;
      const occurredAt = customEvent.detail?.occurredAt ?? Date.now();

      void (async () => {
        const fresh = await fetchPage(1, false, true);

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

        setTimeout(() => void fetchPage(1, false, true), 1200);
      })();
    };
    window.addEventListener(NOTIFICATION_REFRESH_EVENT, onAction);

    const onVisible = () => {
      if (document.visibilityState === "visible") void fetchPage(1, false, true);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(pollId);
      window.removeEventListener(NOTIFICATION_REFRESH_EVENT, onAction);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchPage]);

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
        void 0;
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
      void 0;
    }
  }, []);

  const loadMore = React.useCallback(async () => {
    if (loadingMore) return;
    if (currentPage >= lastPage) return;
    await fetchPage(currentPage + 1, true, true);
  }, [currentPage, fetchPage, lastPage, loadingMore]);

  const reload = React.useCallback(() => void fetchPage(1, false), [fetchPage]);

  const hasMore = currentPage < lastPage;

  return { notifications, unreadCount, totalCount, pageSize: HISTORY_PAGE_SIZE, hasMore, loading, loadingMore, markAsRead, markAllAsRead, loadMore, reload };
}
