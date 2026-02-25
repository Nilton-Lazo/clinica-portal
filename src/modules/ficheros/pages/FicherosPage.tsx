import { Outlet } from "react-router-dom";
import { useState } from "react";
import { FicherosNavTree } from "../components/FicherosNavTree";

export default function FicherosPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-4 md:flex-row md:gap-4">
      <aside className="hidden w-80 shrink-0 md:block">
        <div className="h-full rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 overflow-y-auto overflow-x-hidden app-scrollbar">
          <div className="text-sm font-semibold text-(--color-text-primary)">Ficheros</div>
          <div className="mt-4">
            <FicherosNavTree />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 min-h-0 flex flex-col">
        <div className="mb-3 flex items-center justify-between md:hidden">
          <button
            type="button"
            className="h-10 rounded-xl px-4 text-sm font-medium bg-(--color-panel-context) text-(--color-base-primary) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]"
            onClick={() => setMobileNavOpen(true)}
          >
            Cambiar sección
          </button>
        </div>

        <div className="min-h-0 flex-1 rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4 overflow-y-auto overflow-x-hidden app-scrollbar">
          <Outlet />
        </div>
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-(--color-overlay)"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-(--color-text-primary)">Ficheros</div>
              <button
                type="button"
                className="h-9 rounded-xl px-3 text-sm font-medium bg-(--color-panel-context) text-(--color-base-primary) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]"
                onClick={() => setMobileNavOpen(false)}
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 max-h-[70vh] overflow-auto app-scrollbar">
              <FicherosNavTree onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
