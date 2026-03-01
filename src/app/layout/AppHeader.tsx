import * as React from "react";
import { Link } from "react-router-dom";
import { useRouteMeta } from "../router/useRouteMeta";
import { Settings2, UserCircle2, Menu, ChevronRight } from "lucide-react";
import { NotificationBell } from "../../shared/notifications";

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

  const hasBreadcrumb = meta?.breadcrumb && meta.breadcrumb.length > 1;

  return (
    <header
      className={[
        "h-(--layout-header-height)",
        "bg-(--color-surface)",
        "border-b border-(--color-border)",
        "shadow-sm",
        "sticky top-0 z-20",
      ].join(" ")}
    >
      <div className="h-full flex items-center justify-between gap-3 px-4 sm:px-5">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMenu}
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-(--color-background) transition-colors shrink-0"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5 text-(--color-text-primary)" strokeWidth={1.75} aria-hidden="true" />
          </button>

          <div className="min-w-0 flex flex-col justify-center">
            <div
              className="text-base sm:text-lg font-bold text-(--color-primary) leading-tight truncate"
              title={meta?.title ?? "Sistema"}
            >
              {meta?.title ?? "Sistema"}
            </div>

            {hasBreadcrumb ? (
              <nav
                aria-label="Ruta de navegación"
                className="hidden sm:flex items-center gap-1 flex-wrap"
              >
                {meta!.breadcrumb.map((item, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <ChevronRight
                        className="h-3 w-3 text-(--color-text-secondary) shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    {item.path ? (
                      <Link
                        to={item.path}
                        className="text-xs text-(--color-text-secondary) hover:text-(--color-primary) transition-colors truncate"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span className="text-xs font-medium text-(--color-text-primary) truncate">
                        {item.label}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            ) : (
              meta?.subtitle && (
                <div
                  className="hidden sm:block text-xs text-(--color-text-secondary) truncate"
                  title={meta.subtitle}
                >
                  {meta.subtitle}
                </div>
              )
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <NotificationBell />

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-(--color-background) transition-colors"
            aria-label="Ajustes"
          >
            <Settings2 className="h-5 w-5 text-(--color-primary)" strokeWidth={1.75} aria-hidden="true" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenUserMenu((v) => !v);
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-(--color-background) transition-colors"
              aria-label="Perfil"
              aria-expanded={openUserMenu}
            >
              <UserCircle2 className="h-5 w-5 text-(--color-primary)" strokeWidth={1.75} aria-hidden="true" />
            </button>

            {openUserMenu && (
              <div
                className={[
                  "absolute right-0 mt-2 w-48 rounded-lg",
                  "bg-(--color-surface)",
                  "border border-(--color-border) shadow-lg overflow-hidden",
                ].join(" ")}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="w-full text-left px-4 py-3 text-sm hover:bg-(--color-background) transition-colors"
                >
                  Mi perfil
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-(--color-background) transition-colors"
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
