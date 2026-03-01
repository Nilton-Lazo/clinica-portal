import * as React from "react";
import { Bell } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useNotifications } from "./useNotifications";
import NotificationPanel from "./NotificationPanel";

export default function NotificationBell() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications();

  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Cierra el panel al navegar para evitar overlays persistentes.
  React.useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Cerrar con tecla Escape
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unreadCount > 0
            ? `Notificaciones (${unreadCount} sin leer)`
            : "Notificaciones"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-(--color-background) transition-colors"
      >
        <Bell
          className="h-5 w-5 text-(--color-primary)"
          strokeWidth={1.75}
          aria-hidden="true"
        />

        {/* Badge de no leídas */}
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className={[
              "absolute top-1 right-1",
              "flex h-4 min-w-[16px] items-center justify-center",
              "rounded-full px-1",
              "bg-(--color-danger) text-white",
              "text-[10px] font-bold leading-none",
              "pointer-events-none",
            ].join(" ")}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadCount}
          loading={loading}
          onMarkAsRead={async (id) => {
            await markAsRead(id);
          }}
          onMarkAllAsRead={async () => {
            await markAllAsRead();
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
