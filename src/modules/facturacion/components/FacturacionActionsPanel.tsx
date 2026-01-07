import type { FacturacionHubItem } from "../types/facturacionHub.types";

type Props = {
  item: FacturacionHubItem;
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
  item: FacturacionHubItem;
  onEnter: () => void;
  onAction: (to: string, label: string) => void;
  compact: boolean;
}) {
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className={compact ? "px-4 py-4" : "px-6 py-6"}>
        <div className="text-base font-bold text-(--color-text-primary)">
          {item.title}
        </div>
        <div className="text-sm text-(--color-text-secondary)">
          Selecciona una acción
        </div>
      </div>

      <div className={compact ? "px-4 pb-4" : "px-6 py-4"}>
        <button
          type="button"
          onClick={onEnter}
          className={[
            "w-full h-11",
            "rounded-lg",
            "bg-(--color-primary) text-(--color-text-inverse)",
            "text-base font-semibold",
            "transition-transform duration-150 ease-out",
            "hover:scale-[1.01]",
          ].join(" ")}
        >
          Ingresar a {item.title}
        </button>
      </div>

      <div
        className={[
          "flex-1 min-h-0 overflow-y-auto",
          "app-scrollbar app-scrollbar-no-gutter",
          "[scrollbar-gutter:auto]",
        ].join(" ")}
      >
        {item.actions.length === 0 && (
          <div className={compact ? "px-4 py-4" : "px-6 py-6"}>
            <div className="text-sm text-(--color-text-secondary)">
              No hay acciones configuradas.
            </div>
          </div>
        )}

        {item.actions.length > 0 && (
          <div className="divide-y divide-(--color-panel-context)">
            {item.actions.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onAction(a.to, a.label)}
                className={[
                  "block w-full text-left",
                  compact ? "px-4 py-4 text-sm" : "px-6 py-5 text-sm",
                  "transition-colors",
                  "hover:bg-(--color-primary) hover:text-(--color-text-inverse)",
                  "active:bg-(--color-primary-active) active:text-(--color-text-inverse)",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)",
                ].join(" ")}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FacturacionActionsPanel({
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
          "h-full flex flex-col min-h-0",
          "rounded-lg",
          "border border-(--color-panel-context)",
          "bg-(--color-panel-options-bg)",
          "overflow-hidden",
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
          aria-label="Cerrar panel de acciones"
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
        aria-label="Acciones de facturación"
      >
        <div className="mx-auto w-full max-w-[720px] px-3 pb-[env(safe-area-inset-bottom)]">
          <div
            className={[
              "rounded-xl",
              "border border-(--color-panel-context)",
              "bg-(--color-panel-options-bg)",
              "overflow-hidden",
              "max-h-[70vh]",
              "flex flex-col min-h-0",
            ].join(" ")}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-(--color-panel-context)">
              <div className="min-w-0">
                <div className="text-sm font-bold text-(--color-text-primary) truncate">
                  {item.title}
                </div>
                <div className="text-xs text-(--color-text-secondary) truncate">
                  Selecciona una acción
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="h-9 px-3 rounded-lg border border-(--color-panel-context) bg-(--color-surface) text-sm"
              >
                Cerrar
              </button>
            </div>

            <div className="flex-1 min-h-0">
              <div className="px-0">
                <div className="px-4 pt-4 pb-4">
                  <button
                    type="button"
                    onClick={onEnter}
                    className={[
                      "w-full h-11",
                      "rounded-lg",
                      "bg-(--color-primary) text-(--color-text-inverse)",
                      "text-base font-semibold",
                      "transition-transform duration-150 ease-out",
                      "hover:scale-[1.01]",
                    ].join(" ")}
                  >
                    Ingresar a {item.title}
                  </button>
                </div>

                <div
                  className={[
                    "overflow-y-auto min-h-0",
                    "app-scrollbar app-scrollbar-no-gutter",
                    "[scrollbar-gutter:auto]",
                    "max-h-[calc(70vh-64px-76px)]",
                  ].join(" ")}
                >
                  {item.actions.length === 0 && (
                    <div className="px-4 py-4 text-sm text-(--color-text-secondary)">
                      No hay acciones configuradas.
                    </div>
                  )}

                  {item.actions.length > 0 && (
                    <div className="divide-y divide-(--color-panel-context)">
                      {item.actions.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => onAction(a.to, a.label)}
                          className={[
                            "block w-full text-left",
                            "px-4 py-4 text-sm",
                            "transition-colors",
                            "hover:bg-(--color-primary) hover:text-(--color-text-inverse)",
                            "active:bg-(--color-primary-active) active:text-(--color-text-inverse)",
                          ].join(" ")}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
