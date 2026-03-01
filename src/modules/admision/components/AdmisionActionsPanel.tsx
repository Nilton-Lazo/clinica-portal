import { ChevronRight } from "lucide-react";
import type { AdmisionHubItem } from "../types/admisionHub.types";

type Props = {
  item: AdmisionHubItem;
  onEnter: () => void;
  onAction: (to: string, label: string) => void;
  mode?: "desktop" | "sheet";
  isOpen?: boolean;
  onClose?: () => void;
};

function PanelBody({
  item,
  onEnter,
  onAction,
  compact,
}: {
  item: AdmisionHubItem;
  onEnter: () => void;
  onAction: (to: string, label: string) => void;
  compact: boolean;
}) {
  const Icon = item.icon;
  const hasActions = item.actions.length > 0;

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* ── Cabecera del módulo ── */}
      <div
        className={[
          compact ? "px-4 py-4" : "px-5 py-5",
          "border-b border-(--color-panel-context)",
          "bg-(--color-panel-bg)",
          "shrink-0",
        ].join(" ")}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-(--color-primary)/12 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-(--color-primary)" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-(--color-text-primary) leading-tight truncate">
              {item.title}
            </div>
            <div className="mt-0.5 text-xs text-(--color-text-secondary) leading-snug truncate">
              {item.description}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto app-scrollbar app-scrollbar-no-gutter">
        {!hasActions && (
          <div className={compact ? "p-4" : "p-5"}>
            <button
              type="button"
              onClick={onEnter}
              className={[
                "w-full h-10 rounded-lg",
                "bg-(--color-primary) text-white",
                "text-sm font-semibold",
                "hover:bg-(--color-primary-hover)",
                "transition-colors",
              ].join(" ")}
            >
              Abrir {item.title}
            </button>
          </div>
        )}

        {hasActions && (
          <>
            <div className={compact ? "px-4 pt-3 pb-1" : "px-5 pt-4 pb-1"}>
              <span className="text-[11px] font-bold uppercase tracking-widest text-(--color-text-secondary)/70">
                Acceso directo
              </span>
            </div>

            <div className="divide-y divide-(--color-panel-context)">
              {item.actions.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onAction(a.to, a.label)}
                  className={[
                    "group w-full flex items-center justify-between gap-3",
                    compact ? "px-4 py-3" : "px-5 py-3",
                    "text-sm text-left text-(--color-text-primary)",
                    "hover:bg-(--color-primary) hover:text-white",
                    "active:bg-(--color-primary-active) active:text-white",
                    "transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)",
                  ].join(" ")}
                >
                  <span className="min-w-0 truncate">{a.label}</span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 opacity-35 group-hover:opacity-100 transition-opacity"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdmisionActionsPanel({
  item,
  onEnter,
  onAction,
  mode = "desktop",
  isOpen = false,
  onClose,
}: Props) {
  if (mode === "desktop") {
    return (
      <div
        className={[
          "h-full flex flex-col min-h-0 rounded-xl overflow-hidden",
          "border border-(--color-border)",
          "bg-(--color-panel-options-bg)",
          "shadow-sm",
        ].join(" ")}
      >
        <PanelBody item={item} onEnter={onEnter} onAction={onAction} compact={false} />
      </div>
    );
  }

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar panel"
          onClick={onClose}
          className="lg:hidden fixed inset-0 z-30 bg-(--color-overlay)"
        />
      )}

      <div
        className={[
          "lg:hidden fixed inset-x-0 bottom-0 z-40",
          "transition-transform duration-200 ease-out",
          isOpen ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label="Opciones del módulo"
      >
        <div className="mx-auto w-full max-w-lg px-3 pb-[env(safe-area-inset-bottom)]">
          <div
            className={[
              "rounded-2xl overflow-hidden",
              "border border-(--color-border)",
              "bg-(--color-panel-options-bg)",
              "max-h-[75vh] flex flex-col min-h-0",
              "shadow-xl",
            ].join(" ")}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-(--color-panel-context) bg-(--color-panel-bg) shrink-0">
              <div className="w-8 h-1 rounded-full bg-(--color-panel-context) mx-auto absolute left-1/2 -translate-x-1/2 top-2" aria-hidden="true" />
              <div className="text-sm font-bold text-(--color-text-primary)">Opciones</div>
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-3 rounded-lg bg-(--color-surface) border border-(--color-border) text-xs font-medium"
              >
                Cerrar
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto app-scrollbar app-scrollbar-no-gutter">
              <PanelBody item={item} onEnter={onEnter} onAction={onAction} compact={true} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
