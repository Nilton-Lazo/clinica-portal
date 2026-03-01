import { CheckCheck, Info, AlertTriangle, XCircle, CheckCircle, Loader2 } from "lucide-react";
import type { UserNotification, NotificationType } from "./notificationService";

// ─── Helpers ───────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "Ahora mismo";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `Hace ${days} d`;
}

function NotifIcon({ type, size = 16 }: { type: NotificationType; size?: number }) {
  const cls = `h-[${size}px] w-[${size}px] shrink-0`;
  if (type === "success")
    return <CheckCircle className={cls} style={{ color: "var(--color-success)" }} strokeWidth={1.75} />;
  if (type === "error")
    return <XCircle className={cls} style={{ color: "var(--color-danger)" }} strokeWidth={1.75} />;
  if (type === "warning")
    return <AlertTriangle className={cls} style={{ color: "var(--color-warning)" }} strokeWidth={1.75} />;
  return <Info className={cls} style={{ color: "var(--color-primary)" }} strokeWidth={1.75} />;
}

function typeBg(type: NotificationType): string {
  if (type === "success") return "bg-green-50";
  if (type === "error") return "bg-red-50";
  if (type === "warning") return "bg-amber-50";
  return "bg-blue-50";
}

// ─── Notificación individual ───────────────────────────────────────────────

function NotifItem({
  n,
  onRead,
}: {
  n: UserNotification;
  onRead: (id: number) => void;
}) {
  const unread = !n.read_at;

  return (
    <button
      type="button"
      onClick={() => unread && onRead(n.id)}
      className={[
        "w-full text-left px-4 py-3",
        "flex items-start gap-3",
        "border-b border-(--color-border) last:border-b-0",
        unread
          ? "bg-(--color-surface-hover) hover:bg-blue-50/60 cursor-pointer"
          : "bg-(--color-surface) hover:bg-(--color-background)",
        "transition-colors",
      ].join(" ")}
    >
      {/* Dot indicador */}
      <div className="mt-1 shrink-0">
        {unread ? (
          <span className="block h-2 w-2 rounded-full bg-(--color-primary)" />
        ) : (
          <span className="block h-2 w-2 rounded-full bg-transparent" />
        )}
      </div>

      {/* Ícono tipo */}
      <div className={["h-8 w-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5", typeBg(n.type)].join(" ")}>
        <NotifIcon type={n.type} size={16} />
      </div>

      {/* Contenido */}
      <div className="min-w-0 flex-1">
        <div
          className={[
            "text-sm leading-tight truncate",
            unread ? "font-semibold text-(--color-text-primary)" : "font-medium text-(--color-text-primary)",
          ].join(" ")}
        >
          {n.title}
        </div>
        <div className="mt-0.5 text-xs text-(--color-text-secondary) leading-snug line-clamp-2">
          {n.message}
        </div>
        <div className="mt-1 text-[11px] text-(--color-text-secondary)/70">
          {relativeTime(n.created_at)}
        </div>
      </div>
    </button>
  );
}

// ─── Panel principal ───────────────────────────────────────────────────────

type Props = {
  notifications: UserNotification[];
  unreadCount: number;
  loading: boolean;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
};

export default function NotificationPanel({
  notifications,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}: Props) {
  return (
    /* Overlay invisible para cerrar al hacer clic fuera */
    <>
      <div
        className="fixed inset-0 z-30"
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Centro de notificaciones"
        className={[
          "absolute right-0 top-[calc(100%+8px)] z-40",
          "w-[380px] max-w-[calc(100vw-16px)]",
          "max-h-[520px]",
          "flex flex-col",
          "rounded-xl border border-(--color-border)",
          "bg-(--color-surface)",
          "shadow-xl",
          "overflow-hidden",
        ].join(" ")}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-(--color-border) shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-(--color-text-primary)">
              Notificaciones
            </span>
            {unreadCount > 0 && (
              <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-(--color-primary) text-white text-[11px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-(--color-primary) hover:text-(--color-primary-hover) transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" strokeWidth={2} />
              Marcar todo como leído
            </button>
          )}
        </div>

        {/* Lista */}
        <div className="flex-1 min-h-0 overflow-y-auto app-scrollbar">
          {loading && notifications.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-(--color-primary) animate-spin" strokeWidth={2} />
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-(--color-background) flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-(--color-text-secondary)" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-sm font-semibold text-(--color-text-primary)">Todo al día</div>
                <div className="text-xs text-(--color-text-secondary) mt-0.5">
                  No tienes notificaciones pendientes
                </div>
              </div>
            </div>
          )}

          {notifications.length > 0 && (
            <div>
              {notifications.map((n) => (
                <NotifItem key={n.id} n={n} onRead={onMarkAsRead} />
              ))}
            </div>
          )}
        </div>

        {/* Pie */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t border-(--color-border) shrink-0">
            <p className="text-[11px] text-(--color-text-secondary) text-center">
              Mostrando las últimas {notifications.length} notificaciones
            </p>
          </div>
        )}
      </div>
    </>
  );
}
