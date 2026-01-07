import * as React from "react";
import { useRouteMeta } from "../router/useRouteMeta";
import { Bell, Settings2, UserCircle2, Menu } from "lucide-react";

type Props = {
  onOpenMenu: () => void;
  onLogout: () => void;
};

export default function AppHeader({ onOpenMenu, onLogout }: Props) {
  const meta = useRouteMeta();
  const [openUserMenu, setOpenUserMenu] = React.useState(false);

  React.useEffect(() => {
    const onDoc = () => setOpenUserMenu(false);
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <header
      className={[
        "h-(--layout-header-height) bg-(--color-header-bg)",
        "border-b border-(--color-border)",
        "sticky top-0 z-20",
      ].join(" ")}
    >
      <div className="h-full flex items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMenu}
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-(--color-surface) transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6 text-(--color-text-primary)" strokeWidth={1.60} aria-hidden="true" />
          </button>

            <div className="min-w-0">
                <div
                    className="text-xl sm:text-3xl font-bold text-(--color-primary) leading-tight truncate"
                    title={meta?.title ?? "Sistema"}
                >
                    {meta?.title ?? "Sistema"}
                </div>

                {meta?.subtitle && (
                    <div
                    className="hidden sm:block text-sm text-(--color-text-secondary) truncate"
                    title={meta.subtitle}
                    >
                    {meta.subtitle}
                    </div>
                )}
            </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-(--color-surface) transition-colors"
            aria-label="Notificaciones"
          >
            <Bell className="h-6 w-6 text-(--color-primary)" strokeWidth={1.60} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-(--color-surface) transition-colors"
            aria-label="Ajustes"
          >
            <Settings2 className="h-6 w-6 text-(--color-primary)" strokeWidth={1.60} aria-hidden="true"/>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenUserMenu((v) => !v);
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-(--color-surface) transition-colors"
              aria-label="Perfil"
              aria-expanded={openUserMenu}
            >
              <UserCircle2 className="h-6 w-6 text-(--color-primary)" strokeWidth={1.60} aria-hidden="true" />
            </button>

            {openUserMenu && (
              <div
                className={[
                  "absolute right-0 mt-2 w-48 rounded-xl bg-(--color-surface)",
                  "border border-(--color-border) shadow-lg overflow-hidden",
                ].join(" ")}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="w-full text-left px-4 py-3 text-sm hover:bg-(--color-background)"
                >
                  Mi perfil
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-(--color-background)"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
